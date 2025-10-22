import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
  } catch (error) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const { roster } = await req.json();

  if (!roster || typeof roster !== "object") {
    return NextResponse.json({ error: "Invalid roster: Must be an object" }, { status: 400 });
  }

  try {
    await prisma.roster.upsert({
      where: { userId: decoded.userId },
      update: { players: roster },
      create: { userId: decoded.userId, players: roster },
    });

    return NextResponse.json({ message: "Roster saved successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}