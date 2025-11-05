// app/api/game/join/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const { code } = await req.json();
  const userId = parseInt(payload.userId, 10);

  const game = await prisma.game.findUnique({
    where: { inviteCode: code },
  });

  if (!game) return NextResponse.json({ error: "Invalid code" }, { status: 404 });

  // Already in game?
  if (game.player1Id === userId || game.player2Id === userId) {
    return NextResponse.json({ gameId: game.id });
  }

  // Join as player 2
  const updated = await prisma.game.update({
    where: { id: game.id },
    data: {
      player2Id: userId,
      status: "DRAFTING",           // ← NOT "ACTIVE"
      currentTurn: game.player1Id,  // Player 1 starts
    },
  });

  return NextResponse.json({ gameId: updated.id });
}