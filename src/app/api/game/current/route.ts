// app/api/game/current/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyJwt } from "@/lib/auth";

export async function GET() {
  const payload = await verifyJwt();
  if (!payload) return NextResponse.json([]);

  const games = await prisma.game.findMany({
    where: {
      OR: [{ player1Id: payload.userId }, { player2Id: payload.userId }],
    },
    include: {
      player1: { select: { id: true, username: true } },
      player2: { select: { id: true, username: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  return NextResponse.json(
    games.map((g) => {
      const isPlayer1 = g.player1Id === payload.userId;
      const opponent = isPlayer1 ? g.player2 : g.player1;
      return {
        id: g.id,
        status: g.status,
        opponent: opponent ? { username: opponent.username } : { username: "???" },
      };
    })
  );
}