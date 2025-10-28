import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@chess960/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    const { handle } = await params;

    // Find user
    const user = await prisma.user.findUnique({
      where: { handle },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get current active game (if any)
    const activeGame = await prisma.game.findFirst({
      where: {
        OR: [{ whiteId: user.id }, { blackId: user.id }],
        endedAt: null,
        startedAt: { not: null },
      },
      select: {
        id: true,
        tc: true,
        white: {
          select: {
            id: true,
            handle: true,
            fullName: true,
          },
        },
        black: {
          select: {
            id: true,
            handle: true,
            fullName: true,
          },
        },
      },
    });

    // Get recent games grouped by day with stats
    const recentGames = await prisma.game.findMany({
      where: {
        OR: [{ whiteId: user.id }, { blackId: user.id }],
        endedAt: { not: null },
      },
      select: {
        id: true,
        whiteId: true,
        blackId: true,
        result: true,
        tc: true,
        endedAt: true,
        whiteRatingBefore: true,
        whiteRatingAfter: true,
        blackRatingBefore: true,
        blackRatingAfter: true,
        white: {
          select: {
            id: true,
            handle: true,
            fullName: true,
          },
        },
        black: {
          select: {
            id: true,
            handle: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        endedAt: 'desc',
      },
      take: 50, // Last 50 games
    });

    // Get rating history for the user
    const ratings = await prisma.rating.findMany({
      where: { userId: user.id },
      select: {
        tc: true,
        rating: true,
        updatedAt: true,
      },
    });

    // Group games by day
    interface DayActivity {
      date: string;
      games: typeof recentGames;
      wins: number;
      losses: number;
      draws: number;
      ratingBefore: number | null;
      ratingAfter: number | null;
      tc: string;
    }

    const dailyActivity: Record<string, DayActivity> = {};

    recentGames.forEach((game) => {
      if (!game.endedAt) return;

      const date = new Date(game.endedAt).toISOString().split('T')[0];

      if (!dailyActivity[date]) {
        dailyActivity[date] = {
          date,
          games: [],
          wins: 0,
          losses: 0,
          draws: 0,
          ratingBefore: null,
          ratingAfter: null,
          tc: game.tc,
        };
      }

      dailyActivity[date].games.push(game);

      // Determine result
      const isWhite = game.whiteId === user.id;
      if (game.result === '1-0') {
        if (isWhite) dailyActivity[date].wins++;
        else dailyActivity[date].losses++;
      } else if (game.result === '0-1') {
        if (isWhite) dailyActivity[date].losses++;
        else dailyActivity[date].wins++;
      } else if (game.result === '1/2-1/2') {
        dailyActivity[date].draws++;
      }
    });

    // Sort by date descending
    const sortedActivity = Object.values(dailyActivity).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Get rating before/after for each day (approximate based on games)
    sortedActivity.forEach((day) => {
      const tcRating = ratings.find((r) => r.tc === day.tc);
      if (tcRating) {
        day.ratingAfter = Number(tcRating.rating);
        // Estimate rating before (this is simplified - actual rating changes would need game-by-game calculation)
        day.ratingBefore = day.ratingAfter;
      }
    });

    return NextResponse.json({
      activeGame,
      dailyActivity: sortedActivity.slice(0, 14), // Last 14 days
    });
  } catch (error) {
    console.error('Fetch user activity error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user activity' },
      { status: 500 }
    );
  }
}
