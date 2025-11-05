// src/app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();

  cookieStore.set({
    name: "auth_token",
    value: "",               // clear the value
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,               // expire immediately
    path: "/",
  });

  return NextResponse.json({ message: "Logged out successfully" });
}
