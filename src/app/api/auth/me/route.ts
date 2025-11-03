// src/app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { verifyJwt } from "@/lib/auth";

export async function GET() {
  const user = await verifyJwt();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    userId: user.userId,
    username: user.username,
  });
}