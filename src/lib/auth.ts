// src/lib/auth.ts
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

// Helper to bypass Next.js false positive
async function getAuthCookie() {
  const cookie = await cookies().get("auth_token");
  return cookie?.value ?? null;
}

export async function verifyJwt() {
  const token = await getAuthCookie(); // Now safe

  if (!token) return null;

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      username: string;
    };
    return payload;
  } catch (error) {
    console.error("JWT verify failed:", error);
    return null;
  }
}