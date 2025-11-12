// src/app/api/game/create/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  const token = cookies().get("auth_token")?.value;
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let payload: { userId: string };
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const player1Id = parseInt(payload.userId, 10);

  // Generate invite code (e.g. "AB12CD")
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();

  try {
    // 1. Create Game
    const game = await prisma.game.create({
      data: {
        player1Id,
        status: "PENDING",
        currentTurn: player1Id,
        skipsUsedP1: 0,
        skipsUsedP2: 0,
      },
    });

    // 2. Create invite for player2 entry
    const invite = await prisma.invite.create({
      data: {
        gameId: game.id,
        senderId: player1Id,
        receiverId: null,     // You haven't collected receiver yet
        status: "PENDING",
        // ❗ Store the actual invite code
        // You MUST add this field to your schema
        code,
      },
    });

    return NextResponse.json({
      gameId: game.id,
      code: invite.code,
    });
  } catch (err: any) {
    console.error("Game create error:", err);
    return NextResponse.json(
      { error: "Failed to create game" },
      { status: 500 }
    );
  }
}
