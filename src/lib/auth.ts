// src/lib/auth.ts
import jwt from "jsonwebtoken";

let getAuthCookie: () => Promise<string | null>;

/**
 * Lazy-load cookies() so Next.js doesn't complain
 */
export async function verifyJwt() {
  // Define getAuthCookie on first call
  if (!getAuthCookie) {
    const { cookies } = await import("next/headers");
    getAuthCookie = async () => {
      const cookieStore = await cookies(); // ✅ await cookies() first
      const cookie = cookieStore.get("auth_token");
      return cookie?.value ?? null;
    };
  }

  const token = await getAuthCookie();
  if (!token) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      username: string;
    };
  } catch (error) {
    console.error("JWT verify failed:", error);
    return null;
  }
}
