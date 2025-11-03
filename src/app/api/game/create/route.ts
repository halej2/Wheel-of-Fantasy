// app/api/game/create/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyJwt } from "@/lib/auth";

export async function POST(req: Request) {
  const payload = await verifyJwt();
  if (!payload) return NextResponse.json({ error: "Unauth" }, { status: 401 });

  const code = Math.random().toString(36).substring(2, 8).toUpperCase();

  const game = await prisma.game.create({
    data: {
      player1Id: payload.userId,
      inviteCode: code,
      status: "PENDING",
    },
  });

  return NextResponse.json({ gameId: game.id, code });
}