// app/api/user/search/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyJwt } from "@/lib/auth";

export async function GET(req: Request) {
  const payload = await verifyJwt();
  if (!payload) return NextResponse.json({ error: "Unauth" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim();

  if (!query) return NextResponse.json([]);

  const users = await prisma.user.findMany({
    where: {
      username: { contains: query, mode: "insensitive" },
      id: { not: payload.userId },
    },
    select: { id: true, username: true },
    take: 5,
  });

  return NextResponse.json(users);
}