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

    // For now, redirect to analysis page
    // In the future, this could be a game viewer page
    return (
      <div className="min-h-screen bg-[#1f1d1a] light:bg-[#f5f1ea] text-white light:text-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Game Viewer</h1>
          <p className="text-[#a0958a] light:text-[#5a5449] mb-4">
            Game analysis and replay coming soon
          </p>
          <a 
            href={`/game/${gameId}/analysis`}
            className="px-4 py-2 bg-orange-400 text-white rounded-lg hover:bg-orange-500 transition-colors"
          >
            View Analysis
          </a>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading game:', error);
    notFound();
  }
}
