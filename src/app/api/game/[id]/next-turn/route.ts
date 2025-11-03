// app/api/game/[id]/next-turn/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyJwt } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const payload = await verifyJwt();
  if (!payload) return NextResponse.json({ error: "Unauth" }, { status: 401 });

  const game = await prisma.game.findUnique({
    where: { id: params.id },
    select: { player1Id: true, player2Id: true, currentTurn: true, status: true },
  });

  if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });
  if (game.status !== "ACTIVE") return NextResponse.json({ error: "Game not active" }, { status: 400 });

  const userId = payload.userId;
  const opponentId = game.player1Id === userId ? game.player2Id : game.player1Id;

  if (game.currentTurn !== userId) {
    return NextResponse.json({ error: "Not your turn" }, { status: 403 });
  }

  const nextTurn = opponentId ?? game.player1Id; // fallback to player1 if opponent missing

  await prisma.game.update({
    where: { id: params.id },
    data: { currentTurn: nextTurn },
  });

  return NextResponse.json({ success: true });
}