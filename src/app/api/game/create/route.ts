// src/app/api/game/create/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  console.log("POST /api/game/create");

  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let payload: { userId: string };
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const code = Math.random().toString(36).substring(2, 8).toUpperCase();

  try {
    const game = await prisma.game.create({
      data: {
        player1Id: parseInt(payload.userId, 10),
        player2Id: null,
        inviteCode: code,
        status: "PENDING",
        currentTurn: parseInt(payload.userId, 10), // Player 1 starts
        skipsUsedP1: 0,
        skipsUsedP2: 0,
      },
    });

    return NextResponse.json({
      gameId: game.id,
      code,
    });
  } catch (error: any) {
    console.error("Game create error:", error.message);
    return NextResponse.json({ error: "Failed to create game" }, { status: 500 });
  }
}