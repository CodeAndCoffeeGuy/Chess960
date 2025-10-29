import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@chess960/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const { searchParams } = new URL(request.url);
    const speed = searchParams.get('speed') || 'bullet'; // Default to bullet

    const user = await prisma.user.findUnique({
      where: { handle: username },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Map speed category to database time control values
    const getTimeControlFilter = (speed: string) => {
      switch (speed.toLowerCase()) {
        case 'bullet':
          return ['ONE_PLUS_ZERO', 'TWO_PLUS_ZERO', 'TWO_PLUS_ONE'];
        case 'blitz':
          return ['THREE_PLUS_ZERO', 'THREE_PLUS_TWO', 'FIVE_PLUS_ZERO', 'FIVE_PLUS_THREE'];
        case 'rapid':
          return ['TEN_PLUS_ZERO', 'TEN_PLUS_FIVE', 'FIFTEEN_PLUS_ZERO', 'FIFTEEN_PLUS_TEN'];
        case 'classical':
          return ['THIRTY_PLUS_ZERO', 'THIRTY_PLUS_TWENTY', 'SIXTY_PLUS_ZERO'];
        default:
          return ['ONE_PLUS_ZERO', 'TWO_PLUS_ZERO', 'TWO_PLUS_ONE']; // Default to bullet
      }
    };

    const timeControls = getTimeControlFilter(speed);

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

    // Get current rating for the specified speed category
    // Try to find the most recent rating for any time control in this speed category
    const currentRating = await prisma.rating.findFirst({
      where: {
        userId: user.id,
        tc: {
          in: timeControls,
        },
        variant: 'CHESS960',
      },
      select: {
        rating: true,
        rd: true,
        tc: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // If no rating found, try to get the most recent rating from any time control
    let fallbackRating = null;
    if (!currentRating) {
      fallbackRating = await prisma.rating.findFirst({
        where: {
          userId: user.id,
          variant: 'CHESS960',
        },
        select: {
          rating: true,
          rd: true,
          tc: true,
          updatedAt: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });
    }

    const finalRating = currentRating || fallbackRating;

    return NextResponse.json({
      history: ratingHistory,
      current: finalRating ? {
        rating: Number(finalRating.rating),
        rd: Number(finalRating.rd),
      } : {
        rating: 1500,
        rd: 350,
      },
      speed: speed,
    });
  } catch (error) {
    console.error('Fetch rating history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rating history' },
      { status: 500 }
    );
  }
}
