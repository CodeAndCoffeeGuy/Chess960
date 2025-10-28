import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth';
// import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@chess960/db';

// GET /api/tournaments/[id] - Get tournament details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        players: {
          include: {
            user: {
              select: {
                id: true,
                handle: true,
                country: true,
                isSupporter: true,
              },
            },
          },
          orderBy: [
            { score: 'desc' },
            { performance: 'desc' },
          ],
        },
        _count: {
          select: {
            players: true,
          },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Fetch tournament games for statistics
    const pairings = await prisma.tournamentPairing.findMany({
      where: {
        tournamentId: id,
        gameId: { not: null },
        status: 'FINISHED'
      },
      include: {
        game: {
          select: {
            id: true,
            result: true,
          },
        },
      },
    });

    // Calculate game statistics
    let totalMoves = 0;
    let whiteWins = 0;
    let blackWins = 0;
    let draws = 0;

    pairings.forEach(pairing => {
      if (pairing.game) {
        // Note: moveCount is not available in Game model, would need to count moves separately
        // totalMoves += pairing.game.moveCount || 0;

        // Count wins by result
        const result = pairing.game.result;
        if (result === '1-0' || result?.includes('white') || result === 'resign-black' || result === 'flag-black') {
          whiteWins++;
        } else if (result === '0-1' || result?.includes('black') || result === 'resign-white' || result === 'flag-white') {
          blackWins++;
        } else if (result === '1/2-1/2' || result?.includes('draw') || result === 'stalemate' || result === 'insufficient' || result === 'threefold' || result === 'fifty-move') {
          draws++;
        }
      }
    });

    return NextResponse.json({
      tournament: {
        id: tournament.id,
        name: tournament.name,
        description: tournament.description,
        status: tournament.status,
        tc: tournament.tc,
        startsAt: tournament.startsAt.toISOString(),
        duration: tournament.duration,
        endsAt: tournament.endsAt?.toISOString(),
        maxPlayers: tournament.maxPlayers,
        minRating: tournament.minRating,
        maxRating: tournament.maxRating,
        playerCount: tournament._count.players,
        createdBy: tournament.createdBy,
        winnerId: tournament.winnerId,
        players: tournament.players.map(p => ({
          id: p.id,
          userId: p.userId,
          handle: p.user.handle,
          country: p.user.country,
          isSupporter: p.user.isSupporter,
          joinedAt: p.joinedAt.toISOString(),
          rating: p.rating,
          score: p.score,
          gamesPlayed: p.gamesPlayed,
          wins: p.wins,
          losses: p.losses,
          draws: p.draws,
          streak: p.streak,
          performance: p.performance,
          withdrawn: p.withdrawn,
        })),
        // Game statistics
        stats: {
          totalMoves,
          whiteWins,
          blackWins,
          draws,
          totalGames: pairings.length,
        },
      },
    });
  } catch (error) {
    console.error('Failed to fetch tournament:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tournament' },
      { status: 500 }
    );
  }
}
