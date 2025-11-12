// src/app/api/game/skip-team/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
  try {
    // ---------- AUTH ----------
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    const userId = parseInt(payload.userId, 10);

    // ---------- REQUEST BODY ----------
    const { gameId } = await req.json();
    if (!gameId) return NextResponse.json({ error: "Missing gameId" }, { status: 400 });

    // ---------- GAME ----------
    const gameIdInt = parseInt(gameId, 10);
    const game = await prisma.game.findUnique({
      where: { id: gameIdInt },
      include: {
        picks: true,
        player1: { select: { id: true, username: true } },
        player2: { select: { id: true, username: true } },
      },
    });
    if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });

    // ---------- TURN ----------
    if (game.currentTurn !== userId)
      return NextResponse.json({ error: "Not your turn" }, { status: 403 });

    // ---------- SKIP COUNT ----------
    const isPlayer1 = game.player1Id === userId;
    const skipsUsed = isPlayer1 ? game.skipsUsedP1 : game.skipsUsedP2;
    if (skipsUsed >= 1)
      return NextResponse.json({ error: "No skips left" }, { status: 400 });

    // ---------- UPDATE ----------
    const updatedGame = await prisma.game.update({
      where: { id: game.id },
      data: {
        [isPlayer1 ? "skipsUsedP1" : "skipsUsedP2"]: { increment: 1 },
      },
      include: {
        picks: { orderBy: { createdAt: "asc" } },
        player1: { select: { id: true, username: true } },
        player2: { select: { id: true, username: true } },
      },
    });

    // ---------- RESPONSE ----------
    return NextResponse.json({ success: true, game: updatedGame });
  } catch (err) {
    console.error("Error in /api/game/skip-team:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

