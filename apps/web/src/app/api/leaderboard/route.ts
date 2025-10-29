import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@chess960/db';

// Map speed categories to time controls
// Based on: estimatedTime = limitSeconds + (incrementSeconds * 40)
// - Bullet: < 180s (3 min)
// - Blitz: 180-479s (3-8 min)
// - Rapid: 480-1499s (8-25 min)
// - Classical: >= 1500s (25+ min)
const SPEED_TO_TIME_CONTROLS: Record<string, string[]> = {
  BULLET: ['ONE_PLUS_ZERO', 'TWO_PLUS_ZERO', 'TWO_PLUS_ONE'],
  BLITZ: ['THREE_PLUS_ZERO', 'THREE_PLUS_TWO', 'FIVE_PLUS_ZERO', 'FIVE_PLUS_THREE'],
  RAPID: ['TEN_PLUS_ZERO', 'TEN_PLUS_FIVE', 'FIFTEEN_PLUS_ZERO', 'FIFTEEN_PLUS_TEN'],
  CLASSICAL: ['THIRTY_PLUS_ZERO', 'THIRTY_PLUS_TWENTY', 'SIXTY_PLUS_ZERO'],
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const speedCategory = searchParams.get('tc') || 'BULLET';

    // Get time controls for this speed category
    const timeControls = SPEED_TO_TIME_CONTROLS[speedCategory] || SPEED_TO_TIME_CONTROLS['BULLET'];

    // Fetch top players by rating for specified time control
    const leaderboard = await prisma.rating.findMany({
      where: {
        tc: {
          in: timeControls,
        },
        user: {
          deletedAt: null, // Exclude deleted users
          handle: {
            not: {
              startsWith: 'Guest', // Exclude guest users
            },
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            handle: true,
            country: true,
            isSupporter: true,
            gamesPlayed: true,
            gamesWon: true,
            gamesLost: true,
            gamesDrawn: true,
          },
        },
      },
      orderBy: {
        rating: 'desc',
      },
      take: limit,
    });

    // Format the response
    const formattedLeaderboard = leaderboard.map((entry, index) => ({
      rank: index + 1,
      userId: entry.user.id,
      handle: entry.user.handle || 'Anonymous',
      country: entry.user.country,
      isSupporter: entry.user.isSupporter,
      rating: Math.round(Number(entry.rating)),
      rd: Math.round(Number(entry.rd)),
      gamesPlayed: entry.user.gamesPlayed,
      wins: entry.user.gamesWon,
      losses: entry.user.gamesLost,
      draws: entry.user.gamesDrawn,
    }));

    return NextResponse.json({
      leaderboard: formattedLeaderboard,
      total: formattedLeaderboard.length,
    });
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
