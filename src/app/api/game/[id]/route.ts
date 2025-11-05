// src/app/api/game/[id]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const gameId = parseInt(id, 10);
  if (isNaN(gameId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      player1: { select: { id: true, username: true } },
      player2: { select: { id: true, username: true } },
    },
  });

  // DEBUG: LOG RAW GAME
  console.log("RAW GAME FROM DB:", {
    id: game?.id,
    player1Id: game?.player1Id,
    player2Id: game?.player2Id,
    player1: game?.player1,
    player2: game?.player2,
  });

  if (!game) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const userId = parseInt(payload.userId);
  const isPlayer1 = game.player1Id === userId;

  if (!isPlayer1 && game.player2Id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    id: game.id,
    status: game.status,
    player1: { id: game.player1.id.toString(), username: game.player1.username },
    player2: game.player2
      ? { id: game.player2.id.toString(), username: game.player2.username }
      : null,
    isPlayer1,
    currentTurn: game.currentTurn?.toString() ?? null,
    skipsUsedP1: game.skipsUsedP1,
    skipsUsedP2: game.skipsUsedP2,
    picks: [],
  });
}