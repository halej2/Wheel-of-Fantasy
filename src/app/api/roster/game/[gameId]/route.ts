// app/api/roster/game/[gameId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function GET(req: NextRequest, { params }: { params: { gameId: string } }) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };

    const gameRoster = await prisma.gameRoster.findUnique({
      where: {
        gameId_userId: {
          gameId: params.gameId,
          userId: decoded.userId,
        },
      },
    });

    return NextResponse.json({
      roster: gameRoster?.players ?? null,
      skipsUsed: gameRoster?.skipsUsed ?? 0,
    });
  } catch (error) {
    console.error(`GET /api/roster/game/${params.gameId} error:`, error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}