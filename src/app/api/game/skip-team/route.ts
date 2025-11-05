// src/app/api/game/skip-team/route.ts
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

  const { gameId } = await req.json();
  const game = await prisma.game.findUnique({
    where: { id: gameId },
  });

  if (!game || game.status !== "DRAFTING") {
    return NextResponse.json({ error: "Invalid game" }, { status: 400 });
  }

  const userId = parseInt(payload.userId);
  const isPlayer1 = game.player1Id === userId;
  const skipsUsed = isPlayer1 ? game.skipsUsedP1 : game.skipsUsedP2;

  if (skipsUsed >= 1) {
    return NextResponse.json({ error: "No skips left" }, { status: 400 });
  }

  const field = isPlayer1 ? "skipsUsedP1" : "skipsUsedP2";
  await prisma.game.update({
    where: { id: gameId },
    data: { [field]: { increment: 1 } },
  });

  return NextResponse.json({ success: true });
}