import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const POSITIONS = ["QB", "RB1", "RB2", "WR1", "WR2", "TE", "FLEX", "K", "DEF"];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Await dynamic params before using
  const resolvedParams = await params;
  const { id } = resolvedParams;
  const gameId = parseInt(id, 10);

  if (isNaN(gameId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  // Get auth token from cookies
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: { userId: string };
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const userId = parseInt(payload.userId, 10);

  // Fetch game with players and picks
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      player1: { select: { id: true, username: true } },
      player2: { select: { id: true, username: true } },
      picks: true,
    },
  });

  if (!game) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Verify user is a participant
  if (game.player1Id !== userId && game.player2Id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Determine current turn username
  let currentTurnUsername: string | null = null;
  if (game.currentTurn) {
    if (game.player1Id === game.currentTurn) currentTurnUsername = game.player1.username;
    if (game.player2Id === game.currentTurn) currentTurnUsername = game.player2?.username || null;
  }

  return NextResponse.json({
    id: game.id,
    status: game.status,
    player1: game.player1,
    player2: game.player2,
    isPlayer1: game.player1Id === userId,
    currentTurn: game.currentTurn,
    currentTurnUsername, // For frontend display
    skipsUsedP1: game.skipsUsedP1,
    skipsUsedP2: game.skipsUsedP2,
    picks: game.picks
      .sort((a, b) => POSITIONS.indexOf(a.position) - POSITIONS.indexOf(b.position))
      .map(p => ({
        position: p.position,
        player: p.player,
        playerId: p.playerId.toString(),
      })),
  });
}




