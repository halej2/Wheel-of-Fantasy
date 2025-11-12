// app/api/game/current/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return NextResponse.json([]);

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
  } catch {
    return NextResponse.json([]);
  }

  const userId = parseInt(payload.userId, 10);

  const games = await prisma.game.findMany({
    where: {
      OR: [
        { player1Id: userId },
        { player2Id: userId },
      ],
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
      const isPlayer1 = g.player1Id === userId;
      const opponent = isPlayer1 ? g.player2 : g.player1;

      return {
        id: g.id,
        status: g.status,
        currentTurn: g.currentTurn, // ← ADD THIS
        player1: {
          id: g.player1.id,
          username: g.player1.username,
        },
        player2: {
          id: g.player2.id,
          username: g.player2.username,
        },
        opponent: opponent
          ? { username: opponent.username }
          : { username: "???" },
        isMyTurn: g.currentTurn === userId, // ← BONUS: convenience
      };
    })
  );
}