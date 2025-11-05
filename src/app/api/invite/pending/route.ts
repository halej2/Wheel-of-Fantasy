import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyJwt } from "@/lib/auth";

export async function GET() {
  // ✅ Let verifyJwt handle reading the cookie
  const payload = await verifyJwt();
  if (!payload) {
    return NextResponse.json([], { status: 401 });
  }

  const invites = await prisma.invite.findMany({
    where: {
      OR: [
        { senderId: parseInt(payload.userId) },
        { receiverId: parseInt(payload.userId) },
      ],
      status: "PENDING",
    },
    include: {
      sender: { select: { id: true, username: true } },
      receiver: { select: { id: true, username: true } },
      game: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    invites.map((i) => ({
      id: i.id,
      gameId: i.gameId,
      sender: i.sender,
      receiver: i.receiver,
      senderId: i.senderId,
      receiverId: i.receiverId,
    }))
  );
}
