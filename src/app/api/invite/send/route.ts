// app/api/invite/send/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyJwt } from "@/lib/auth";

export async function POST(req: Request) {
  const payload = await verifyJwt();
  if (!payload) return NextResponse.json({ error: "Unauth" }, { status: 401 });

  const { friendId } = await req.json();

  const game = await prisma.game.create({
    data: {
      player1Id: payload.userId,
      status: "PENDING",
    },
  });

  await prisma.invite.create({
    data: {
      senderId: payload.userId,
      receiverId: friendId,
      gameId: game.id,
    },
  });

  return NextResponse.json({ gameId: game.id });
}