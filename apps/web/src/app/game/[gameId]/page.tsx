import { Metadata } from 'next';
import { generateGameSEO } from '@/lib/seo';
import { prisma } from '@chess960/db';
import { notFound } from 'next/navigation';

interface GamePageProps {
  params: Promise<{ gameId: string }>;
}

export async function generateMetadata({ params }: GamePageProps): Promise<Metadata> {
  const { gameId } = await params;
  
  try {
    // Fetch game data for SEO
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: {
        id: true,
        whiteId: true,
        blackId: true,
        result: true,
        timeControl: true,
        createdAt: true,
        white: {
          select: { handle: true },
        },
        black: {
          select: { handle: true },
        },
      },
    });

    if (!game) {
      return generateGameSEO(gameId);
    }

    const whitePlayer = game.white?.handle || 'Anonymous';
    const blackPlayer = game.black?.handle || 'Anonymous';
    const result = game.result || 'Ongoing';
    const timeControl = game.timeControl || 'Unknown';

    return generateGameSEO(gameId, whitePlayer, blackPlayer, result, timeControl);
  } catch (error) {
    console.error('Error generating game metadata:', error);
    return generateGameSEO(gameId);
  }
}

export default async function GamePage({ params }: GamePageProps) {
  const { gameId } = await params;
  
  try {
    // Verify game exists
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true },
    });

    if (!game) {
      notFound();
    }

    // Redirect to analysis page
    // Using redirect() for proper server-side redirect
    const { redirect } = await import('next/navigation');
    redirect(`/game/${gameId}/analysis`);
  } catch (error) {
    console.error('Error loading game:', error);
    notFound();
  }
}
