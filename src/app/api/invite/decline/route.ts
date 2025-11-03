import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyJwt } from "@/lib/auth";

export async function POST(req: Request) {
  const payload = await verifyJwt();
  if (!payload) return NextResponse.json({ error: "Unauth" }, { status: 401 });

  const { inviteId } = await req.json();
  await prisma.invite.update({
    where: { id: inviteId },
    data: { status: "DECLINED" },
  });
  return NextResponse.json({ success: true });
}