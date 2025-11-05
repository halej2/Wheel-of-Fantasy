// src/app/api/invite/send/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  console.log("POST /api/invite/send");

  const cookie = await cookies().get("auth_token");
  const token = cookie?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  try {
    const { friendId } = await req.json();

    const game = await prisma.game.create({
      data: {
        player1Id: parseInt(payload.userId, 10), // ← STRING → NUMBER
        player2Id: parseInt(friendId, 10),       // ← STRING → NUMBER
        status: "PENDING",
      },
    });

    const invite = await prisma.invite.create({
      data: {
        gameId: game.id,
        senderId: parseInt(payload.userId, 10),
        receiverId: parseInt(friendId, 10),
        status: "PENDING",
      },
    });

    return NextResponse.json({ gameId: game.id });
  } catch (error: any) {
    console.error("Invite error:", error.message);
    return NextResponse.json({ error: "Failed to send invite" }, { status: 500 });
  }
}