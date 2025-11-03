// app/api/game/[id]/end/route.ts
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
    select: { player1Id: true, player2Id: true },
  });

  if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });

  const userId = payload.userId;
  if (userId !== game.player1Id && userId !== game.player2Id) {
    return NextResponse.json({ error: "Not in game" }, { status: 403 });
  }

  await prisma.game.update({
    where: { id: params.id },
    data: { status: "COMPLETED" },
  });

  return NextResponse.json({ success: true });
}