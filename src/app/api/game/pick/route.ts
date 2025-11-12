// src/app/api/game/pick/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const POSITIONS = ["QB", "RB1", "RB2", "WR1", "WR2", "TE", "FLEX", "K", "DEF"];
const POSITION_TO_SLOTS: Record<string, string[]> = {
  QB: ["QB"],
  RB: ["RB1", "RB2", "FLEX"],
  WR: ["WR1", "WR2", "FLEX"],
  TE: ["TE", "FLEX"],
  K: ["K"],
  DEF: ["DEF"],
};

export async function POST(req: NextRequest) {
  let userId: number;
  try {
    // --- AUTH ---
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) {
      console.log("Missing auth_token");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      userId = parseInt(payload.userId, 10);
    } catch (e) {
      console.log("Invalid token:", e);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // --- BODY ---
    const body = await req.json();
    console.log("Received payload:", body);  // LOG WHAT SERVER GETS

    const { gameId, player } = body;
    if (!gameId || !player || !player.position || !player.name || !player.team) {
      console.log("Invalid data:", { gameId, player });
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const gameIdInt = parseInt(gameId, 10);
    if (isNaN(gameIdInt)) {
      return NextResponse.json({ error: "Invalid gameId" }, { status: 400 });
    }

    // --- GAME ---
    const game = await prisma.game.findUnique({
      where: { id: gameIdInt },
      include: { picks: true },
    });
    if (!game) {
      console.log("Game not found:", gameIdInt);
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    if (game.status !== "DRAFTING") {
      return NextResponse.json({ error: "Draft not active" }, { status: 400 });
    }

    // --- TURN ---
    if (!game.currentTurn || game.currentTurn !== userId) {
      return NextResponse.json({ error: "Not your turn" }, { status: 403 });
    }

    // --- PLAYER TAKEN ---
    if (game.picks.some(p => p.playerName === player.name)) {
      return NextResponse.json({ error: "Player already picked" }, { status: 400 });
    }

    // --- ROSTER ---
    const myPicks = game.picks.filter(p => p.playerId === userId);
    if (myPicks.length >= POSITIONS.length) {
      return NextResponse.json({ error: "Roster full" }, { status: 400 });
    }

    const filled = myPicks.map(p => p.position);
    const open = POSITIONS.filter(s => !filled.includes(s));
    const playerPos = player.position.toUpperCase();
    const allowed = POSITION_TO_SLOTS[playerPos] ?? [];
    const validOpen = open.filter(s => allowed.includes(s));
    if (validOpen.length === 0) {
      return NextResponse.json({ error: `No open slot for ${playerPos}` }, { status: 400 });
    }

    const assignedSlot = validOpen[0];

    // --- TRANSACTION ---
    const updatedGame = await prisma.$transaction(async (tx) => {
      await tx.gamePick.create({
        data: {
          gameId: game.id,
          playerId: userId,
          position: assignedSlot,
          player,
          playerName: player.name,
        },
      });

      const p1Count = await tx.gamePick.count({ where: { gameId: game.id, playerId: game.player1Id } });
      const p2Count = await tx.gamePick.count({ where: { gameId: game.id, playerId: game.player2Id } });
      const bothFull = p1Count >= POSITIONS.length && p2Count >= POSITIONS.length;
      const nextTurn = bothFull ? null : (userId === game.player1Id ? game.player2Id : game.player1Id);

      return tx.game.update({
        where: { id: game.id },
        data: {
          currentTurn: nextTurn,
          status: bothFull ? "COMPLETE" : "DRAFTING",
        },
        include: {
          picks: { orderBy: { createdAt: "asc" } },
          player1: { select: { id: true, username: true } },
          player2: { select: { id: true, username: true } },
        },
      });
    });

    return NextResponse.json({ success: true, game: updatedGame });
  } catch (err: any) {
    console.error("PICK ERROR:", err.message, err.stack);
    return NextResponse.json(
      { error: "Server error", details: err.message },
      { status: 500 }
    );
  }
}








