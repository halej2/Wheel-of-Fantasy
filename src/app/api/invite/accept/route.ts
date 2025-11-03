import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyJwt } from "@/lib/auth";

export async function POST(req: Request) {
  const payload = await verifyJwt();
  if (!payload) return NextResponse.json({ error: "Unauth" }, { status: 401 });

  const { inviteId } = await req.json();
  const invite = await prisma.invite.findUnique({ where: { id: inviteId } });
  if (!invite || invite.receiverId !== payload.userId)
    return NextResponse.json({ error: "Invalid invite" }, { status: 400 });

  await prisma.$transaction([
    prisma.invite.update({ where: { id: inviteId }, data: { status: "ACCEPTED" } }),
    prisma.game.update({
      where: { id: invite.gameId },
      data: { player2Id: payload.userId, status: "ACTIVE" },
    }),
  ]);

  return NextResponse.json({ success: true });
}