// app/api/roster/game/[gameId]/opponent/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function GET(req: NextRequest, { params }: { params: { gameId: string } }) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };

    const game = await prisma.game.findUnique({
      where: { id: params.gameId },
      select: { player1Id: true, player2Id: true },
    });

    if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });

    const currentUserIdStr = String(decoded.userId);
    const opponentId = game.player1Id === currentUserIdStr ? game.player2Id : game.player1Id;

    if (!opponentId) return NextResponse.json({ roster: null, skipsUsed: 0 });

    const oppRoster = await prisma.gameRoster.findUnique({
      where: {
        gameId_userId: {
          gameId: params.gameId,
          userId: Number(opponentId),
        },
      },
    });

    return NextResponse.json({
      roster: oppRoster?.players ?? null,
      skipsUsed: oppRoster?.skipsUsed ?? 0,
    });
  } catch (error) {
    console.error(`GET /api/roster/game/${params.gameId}/opponent error:`, error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}