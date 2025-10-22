import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";

const prisma = new PrismaClient();

export async function GET() {
  const cookieStore = cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });

  const roster = await prisma.player.findMany({ where: { userId: session } });
  return new Response(JSON.stringify({ roster }), { status: 200 });
}

export async function POST(req: Request) {
  const cookieStore = cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });

  const { roster } = await req.json();

  // Delete old roster
  await prisma.player.deleteMany({ where: { userId: session } });

  // Save new roster
  await prisma.player.createMany({
    data: roster.map((p: any) => ({ ...p, userId: session })),
  });

  return new Response(JSON.stringify({ success: true }));
}
