// app/api/game/current/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function GET() {
  // AWAIT cookies() — NO verifyJwt helper
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return NextResponse.json([]);

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
  } catch {
    return NextResponse.json([]);
  }

  const games = await prisma.game.findMany({
    where: {
      OR: [
        { player1Id: parseInt(payload.userId) },
        { player2Id: parseInt(payload.userId) },
      ],
    },
    include: {
      player1: { select: { id: true, username: true } },
      player2: { select: { id: true, username: true } }, // ← MUST INCLUDE
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  return NextResponse.json(
    games.map((g) => {
      const isPlayer1 = g.player1Id === parseInt(payload.userId);
      const opponent = isPlayer1 ? g.player2 : g.player1;

      return {
        id: g.id,
        status: g.status,
        opponent: opponent
          ? { username: opponent.username }
          : { username: "???" },
      };
    })
  );
}