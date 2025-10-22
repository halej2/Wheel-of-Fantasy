import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { serialize } from "cookie";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const { username, password } = await req.json();

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return new Response(JSON.stringify({ message: "Invalid credentials" }), { status: 401 });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return new Response(JSON.stringify({ message: "Invalid credentials" }), { status: 401 });

  const token = user.id; // simple session token; replace with JWT if needed
  const headers = new Headers();
  headers.append("Set-Cookie", serialize("session", token, { path: "/", httpOnly: true }));

  return new Response(JSON.stringify({ success: true, userId: user.id }), { status: 200, headers });
}
