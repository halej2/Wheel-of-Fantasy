// app/api/game/join/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  const token = cookies().get("auth_token")?.value;
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const { code } = await req.json();
  const userId = parseInt(payload.userId, 10);

  // 1. Find invite by code
  const invite = await prisma.invite.findUnique({
    where: { id: parseInt(code) }, // You will probably switch to a real code later
    include: { game: true },
  });

  if (!invite)
    return NextResponse.json({ error: "Invalid code" }, { status: 404 });

  // 2. Ensure the user is the invited player
  if (invite.receiverId !== userId)
    return NextResponse.json(
      { error: "You are not the invited user" },
      { status: 403 }
    );

  const game = invite.game;

  // 3. Game already has two players?
  if (game.player2Id)
    return NextResponse.json(
      { error: "Game already full" },
      { status: 400 }
    );

  // 4. If user already joined (player1)
  if (game.player1Id === userId)
    return NextResponse.json({ gameId: game.id });

  // 5. Join game as player2
  const updatedGame = await prisma.game.update({
    where: { id: game.id },
    data: {
      player2Id: userId,
      status: "DRAFTING",
      currentTurn: game.player1Id, // P1 always starts
    },
  });

  // 6. Mark invite as accepted
  await prisma.invite.update({
    where: { id: invite.id },
    data: { status: "ACCEPTED" },
  });

  return NextResponse.json({ gameId: updatedGame.id });
}
