import { NextRequest, NextResponse } from 'next/server';
import { getAuthService } from '@chess960/utils';
import { db } from '@chess960/db';

export async function GET(request: NextRequest) {
  try {
    const authService = getAuthService();
    
    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify token
    const payload = authService.verifyAuthToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get current ratings
    const ratings = await db.rating.findMany({
      where: { userId: payload.userId },
      select: { tc: true, rating: true, rd: true, updatedAt: true },
    });

    // Get completed games for stats
    const games = await db.game.findMany({
      where: {
        OR: [{ whiteId: payload.userId }, { blackId: payload.userId }],
        result: { not: 'abort' },
        endedAt: { not: null },
      },
      select: {
        id: true,
        result: true,
        whiteId: true,
        tc: true,
        startedAt: true,
        endedAt: true,
        moves: {
          select: { id: true },
        },
      },
    });

    // Calculate stats by time control
    const statsByTc: Record<string, any> = {
      '1+0': { wins: 0, losses: 0, draws: 0, total: 0, totalTime: 0 },
      '2+0': { wins: 0, losses: 0, draws: 0, total: 0, totalTime: 0 },
    };

    games.forEach(game => {
      const tc = game.tc === 'ONE_PLUS_ZERO' ? '1+0' : '2+0';
      const isWhite = game.whiteId === payload.userId;
      const result = game.result;

      statsByTc[tc].total++;

      // Calculate game duration
      if (game.startedAt && game.endedAt) {
        const duration = (game.endedAt.getTime() - game.startedAt.getTime()) / 1000;
        statsByTc[tc].totalTime += duration;
      }

      // Determine win/loss/draw
      if (result === '1-0') {
        if (isWhite) statsByTc[tc].wins++;
        else statsByTc[tc].losses++;
      } else if (result === '0-1') {
        if (isWhite) statsByTc[tc].losses++;
        else statsByTc[tc].wins++;
      } else if (result === '1/2-1/2') {
        statsByTc[tc].draws++;
      } else if (result?.includes('flag') || result?.includes('resign')) {
        const whiteWon = result === 'flag-black' || result === 'resign-black';
        if ((whiteWon && isWhite) || (!whiteWon && !isWhite)) {
          statsByTc[tc].wins++;
        } else {
          statsByTc[tc].losses++;
        }
      }
    });

    // Calculate win rates and average game duration
    Object.keys(statsByTc).forEach(tc => {
      const stats = statsByTc[tc];
      stats.winRate = stats.total > 0 ? Math.round((stats.wins / stats.total) * 100) : 0;
      stats.avgDuration = stats.total > 0 ? Math.round(stats.totalTime / stats.total) : 0;
      delete stats.totalTime; // Remove raw total time
    });

    // Format ratings
    const ratingsByTc: Record<string, any> = {};
    ratings.forEach(rating => {
      let tc: string;
      if (rating.tc === 'ONE_PLUS_ZERO') {
        tc = '1+0';
      } else if (rating.tc === 'TWO_PLUS_ZERO') {
        tc = '2+0';
      } else if (rating.tc === 'BULLET') {
        tc = 'bullet';
      } else {
        tc = rating.tc;
      }

      ratingsByTc[tc] = {
        rating: Math.round(Number(rating.rating)),
        rd: Math.round(Number(rating.rd)),
        lastGame: rating.updatedAt,
      };
    });

    // Recent activity (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentGames = games.filter(game => 
      game.startedAt && game.startedAt > weekAgo
    );

    return NextResponse.json({
      ratings: ratingsByTc,
      stats: statsByTc,
      summary: {
        totalGames: games.length,
        recentGames: recentGames.length,
        favoriteTimeControl: statsByTc['1+0'].total > statsByTc['2+0'].total ? '1+0' : '2+0',
        memberSince: payload.type === 'user' ? await getUserJoinDate(payload.userId) : null,
      },
    });

  } catch (error) {
    console.error('Game stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function getUserJoinDate(userId: string): Promise<Date | null> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { createdAt: true },
    });
    return user?.createdAt || null;
  } catch {
    return null;
  }
}