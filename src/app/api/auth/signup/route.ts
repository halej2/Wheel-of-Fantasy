import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const { username, password } = await req.json();

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: { username, password: hashedPassword },
    });
    return new Response(JSON.stringify({ success: true, userId: user.id }), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: "Username already exists" }), { status: 400 });
  }
}
