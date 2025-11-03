// app/api/game/join/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyJwt } from "@/lib/auth";

export async function POST(req: Request) {
  const payload = await verifyJwt();
  if (!payload) return NextResponse.json({ error: "Unauth" }, { status: 401 });

  const { code } = await req.json();

  const game = await prisma.game.findUnique({
    where: { inviteCode: code },
  });

  if (!game) return NextResponse.json({ error: "Invalid code" }, { status: 404 });

  // Already player 1? → just return the game
  if (game.player1Id === payload.userId) {
    return NextResponse.json({ gameId: game.id });
  }

  // Join as player 2
  const updated = await prisma.game.update({
    where: { id: game.id },
    data: {
      player2Id: payload.userId,   // Int → Int
      status: "ACTIVE",
      currentTurn: game.player1Id, // player 1 starts
    },
  });

  return NextResponse.json({ gameId: updated.id });
}