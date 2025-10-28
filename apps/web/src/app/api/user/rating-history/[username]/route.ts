import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@chess960/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const { searchParams } = new URL(request.url);
    const tc = searchParams.get('tc') || 'bullet'; // Default to bullet (unified rating)

    const user = await prisma.user.findUnique({
      where: { handle: username },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Map time control parameter to database values
    const getTimeControlFilter = (tc: string) => {
      switch (tc.toLowerCase()) {
        case 'bullet':
          return ['ONE_PLUS_ZERO', 'TWO_PLUS_ZERO'];
        case 'blitz':
          return ['THREE_PLUS_ZERO', 'FIVE_PLUS_ZERO'];
        case 'rapid':
          return ['TEN_PLUS_ZERO', 'FIFTEEN_PLUS_TEN'];
        case 'classical':
          return ['THIRTY_PLUS_ZERO', 'SIXTY_PLUS_ZERO'];
        default:
          return ['ONE_PLUS_ZERO', 'TWO_PLUS_ZERO']; // Default to bullet
      }
    };

    const timeControls = getTimeControlFilter(tc);

    // Get games for the specified time control
    const games = await prisma.game.findMany({
      where: {
        OR: [
          { whiteId: user.id },
          { blackId: user.id },
        ],
        tc: {
          in: timeControls,
        },
        endedAt: { not: null },
      },
      select: {
        id: true,
        whiteId: true,
        blackId: true,
        whiteRatingAfter: true,
        blackRatingAfter: true,
        endedAt: true,
      },
      orderBy: { endedAt: 'asc' },
      take: 100, // Last 100 games
    });

    // Build rating history data points
    const ratingHistory = games.map(game => {
      const isWhite = game.whiteId === user.id;
      const rating = isWhite ? game.whiteRatingAfter : game.blackRatingAfter;

      return {
        gameId: game.id,
        rating: rating || 1500,
        timestamp: game.endedAt?.toISOString() || new Date().toISOString(),
      };
    }).filter(point => point.rating !== null);

    // Get current rating for the specified time control
    const currentRating = await prisma.rating.findUnique({
      where: {
        userId_tc_variant: {
          userId: user.id,
          tc: timeControls[0] as any, // Use first time control from the filter
          variant: 'CHESS960',
        },
      },
      select: {
        rating: true,
        rd: true,
      },
    });

    return NextResponse.json({
      history: ratingHistory,
      current: currentRating ? {
        rating: currentRating.rating,
        rd: currentRating.rd,
      } : {
        rating: 1500,
        rd: 350,
      },
      tc: 'bullet',
    });
  } catch (error) {
    console.error('Fetch rating history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rating history' },
      { status: 500 }
    );
  }
}
