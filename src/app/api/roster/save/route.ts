import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
    const { roster, skipsUsed } = await req.json();

    if (!roster || typeof roster !== "object") {
      return NextResponse.json({ error: "Invalid roster" }, { status: 400 });
    }

    // ✅ FIX: Use update OR create (works for NEW accounts)
    await prisma.roster.upsert({
      where: { userId: decoded.userId },
      update: { 
        players: roster,
        ...(skipsUsed !== undefined && { skipsUsed })
      },
      create: { 
        userId: decoded.userId, 
        players: roster, 
        skipsUsed: skipsUsed ?? 0 
      },
    });

    return NextResponse.json({ message: "Saved" });
  } catch (error) {
    console.error("Save error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ✅ ADD THIS: Also allow PUT method (backup)
export async function PUT(req: NextRequest) {
  return POST(req); // Same logic
}