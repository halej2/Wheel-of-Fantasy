import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };

    const roster = await prisma.roster.findUnique({
      where: { userId: decoded.userId },
    });

    return NextResponse.json({
      roster: roster?.players ?? null,
      skipsUsed: roster?.skipsUsed ?? 0
    });
  } catch (error) {
    console.error("GET /api/roster/get error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}