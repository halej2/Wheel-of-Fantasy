// src/app/api/invite/accept/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  // 1. GET JWT FROM COOKIE (await cookies!)
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 2. VERIFY JWT
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const { inviteId } = await req.json();

  const invite = await prisma.invite.findUnique({
    where: { id: inviteId },
    include: { game: true },
  });

  if (!invite || invite.status !== "PENDING" || invite.receiverId !== parseInt(payload.userId)) {
    return NextResponse.json({ error: "Invalid invite" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.invite.update({
      where: { id: inviteId },
      data: { status: "ACCEPTED" },
    }),
    prisma.game.update({
      where: { id: invite.gameId },
      data: { 
        player2Id: parseInt(payload.userId),
        status: "DRAFTING", // ← NOT "ACTIVE"
        currentTurn: invite.game.player1Id, // Player 1 starts
      },
    }),
  ]);

  return NextResponse.json({ success: true, gameId: invite.gameId });
}