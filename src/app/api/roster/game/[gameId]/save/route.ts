// app/api/roster/game/[gameId]/save/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest, { params }: { params: { gameId: string } }) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
    const { roster, skipsUsed } = await req.json();

    const saved = await prisma.gameRoster.upsert({
      where: {
        gameId_userId: {
          gameId: params.gameId,
          userId: decoded.userId,
        },
      },
      update: {
        players: roster,
        skipsUsed: skipsUsed ?? 0,
      },
      create: {
        gameId: params.gameId,
        userId: decoded.userId,
        players: roster,
        skipsUsed: skipsUsed ?? 0,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`POST /api/roster/game/${params.gameId}/save error:`, error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}