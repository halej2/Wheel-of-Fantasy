// GET: Load game
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const game = await prisma.game.findUnique({
    where: { id: params.id },
    include: { player1: true, player2: true },
  });
  return NextResponse.json(game);
}