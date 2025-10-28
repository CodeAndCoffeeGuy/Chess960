import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@chess960/db';

export async function GET(request: NextRequest) {
  try {
    // Get session
    const session = await getServerSession(authOptions);

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);
    const userIdParam = searchParams.get('userId');

    // If userId is provided, use it; otherwise require authentication
    const targetUserId = userIdParam || session?.user?.id;

    if (!targetUserId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get games
    const games = await db.game.findMany({
      where: {
        OR: [
          { whiteId: targetUserId },
          { blackId: targetUserId },
        ],
        endedAt: { not: null },
      },
      include: {
        white: {
          select: { handle: true },
        },
        black: {
          select: { handle: true },
        },
        moves: {
          orderBy: { ply: 'asc' },
          select: { uci: true, ply: true, serverTs: true },
        },
      },
      orderBy: { endedAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const formattedGames = games.map(game => ({
      id: game.id,
      tc: game.tc === 'ONE_PLUS_ZERO' ? '1+0' : '2+0',
      result: game.result || 'unknown',
      rated: game.rated,
      startedAt: game.startedAt?.toISOString() || new Date().toISOString(),
      endedAt: game.endedAt?.toISOString() || new Date().toISOString(),
      playerColor: game.whiteId === targetUserId ? 'white' : 'black',
      whiteId: game.whiteId,
      blackId: game.blackId,
      whiteHandle: game.white?.handle || 'Anonymous',
      blackHandle: game.black?.handle || 'Anonymous',
      whiteRatingBefore: game.whiteRatingBefore || 1500,
      blackRatingBefore: game.blackRatingBefore || 1500,
      whiteRatingAfter: game.whiteRatingAfter || 1500,
      blackRatingAfter: game.blackRatingAfter || 1500,
      opponent: {
        handle: game.whiteId === targetUserId ? game.black?.handle : game.white?.handle,
      },
      moves: game.moves.map(move => move.uci),
      moveCount: game.moves.length,
      duration: game.startedAt && game.endedAt
        ? Math.round((game.endedAt.getTime() - game.startedAt.getTime()) / 1000)
        : null,
      opening: null, // Opening analysis not implemented yet
    }));

    // Get total count for pagination
    const totalGames = await db.game.count({
      where: {
        OR: [
          { whiteId: targetUserId },
          { blackId: targetUserId },
        ],
        endedAt: { not: null },
      },
    });

    return NextResponse.json({
      games: formattedGames,
      pagination: {
        total: totalGames,
        limit,
        offset,
        hasMore: offset + limit < totalGames,
      },
    });

  } catch (error) {
    console.error('Game history error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}