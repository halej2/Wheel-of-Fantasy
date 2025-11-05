// src/app/api/game/pick/route.ts
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

  const { gameId, player } = await req.json();
  const userId = parseInt(payload.userId);

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: { picks: true },
  });

  if (!game || game.status !== "DRAFTING" || !game.player2Id) {
    return NextResponse.json({ error: "Invalid game" }, { status: 400 });
  }

  const isPlayer1 = game.player1Id === userId;
  const currentTurn = game.currentTurn === game.player1Id ? "p1" : "p2";
  const myTurn = (isPlayer1 && currentTurn === "p1") || (!isPlayer1 && currentTurn === "p2");

  if (!myTurn) {
    return NextResponse.json({ error: "Not your turn" }, { status: 403 });
  }

  if (game.picks.some(p => p.player.name === player.name)) {
    return NextResponse.json({ error: "Player taken" }, { status: 400 });
  }

  const round = Math.floor(game.picks.length / 2) + 1;
  const pickInRound = game.picks.length % 2 === 0 ? 1 : 2;

  await prisma.gamePick.create({
    data: {
      gameId,
      playerId: userId,
      position: getNextPosition(game.picks, userId),
      player: player,
      round,
      pickInRound,
    },
  });

  const nextTurn = game.picks.length % 2 === 0 ? game.player2Id : game.player1Id;
  await prisma.game.update({
    where: { id: gameId },
    data: { currentTurn: nextTurn },
  });

  return NextResponse.json({ success: true });
}

function getNextPosition(picks: any[], userId: string) {
  const myPicks = picks.filter(p => p.playerId === userId).map(p => p.position);
  const order = ["QB", "RB1", "RB2", "WR1", "WR2", "TE", "FLEX", "K", "DEF"];
  return order.find(pos => !myPicks.includes(pos))!;
}