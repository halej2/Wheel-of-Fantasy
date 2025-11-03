import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyJwt } from "@/lib/auth";

export async function GET() {
  const payload = await verifyJwt();
  if (!payload) return NextResponse.json([], { status: 401 });

  const games = await prisma.game.findMany({
    where: {
      OR: [{ player1Id: payload.userId }, { player2Id: payload.userId }],
      status: { in: ["PENDING", "ACTIVE"] },
    },
    include: {
      player1: { select: { id: true, username: true } },
      player2: { select: { id: true, username: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(
    games.map((g) => ({
      id: g.id,
      status: g.status,
      player1Id: g.player1Id,
      player2Id: g.player2Id,
      player1: g.player1,
      player2: g.player2,
    }))
  );
}