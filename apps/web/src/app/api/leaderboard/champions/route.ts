import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@chess960/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    // Fetch recent finished tournaments with winners
    const tournaments = await prisma.tournament.findMany({
      where: {
        status: 'FINISHED',
        winnerId: {
          not: null, // Only tournaments with a winner
        },
      },
      include: {
        players: {
          orderBy: {
            score: 'desc',
          },
          take: 1, // Get the top player (winner)
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
        },
      },
      orderBy: {
        endsAt: 'desc',
      },
      take: limit,
    });

    // Format the response
    const champions = tournaments
      .filter((tournament) => tournament.players.length > 0)
      .map((tournament) => {
        const winner = tournament.players[0];
        return {
          tournamentId: tournament.id,
          tournamentName: tournament.name,
          winnerId: winner.user.id,
          winnerHandle: winner.user.handle || 'Anonymous',
          winnerCountry: winner.user.country,
          winnerIsSupporter: winner.user.isSupporter,
          score: winner.score,
          gamesPlayed: winner.gamesPlayed,
          tc: tournament.tc,
          finishedAt: tournament.endsAt,
        };
      });

    return NextResponse.json({
      champions,
      total: champions.length,
    });
  } catch (error) {
    console.error('Champions fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch champions' },
      { status: 500 }
    );
  }
}
