import { NextRequest, NextResponse } from 'next/server';
import { db } from '@chess960/db';
import { getChess960Position } from '@chess960/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;

    const game = await db.game.findUnique({
      where: { id: gameId },
      include: {
        white: {
          select: { handle: true, id: true },
        },
        black: {
          select: { handle: true, id: true },
        },
        moves: {
          orderBy: { ply: 'asc' },
          select: { uci: true, ply: true, serverTs: true },
        },
      },
    });

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Compute initialFen for Chess960 games
    let initialFen: string | undefined;
    if (game.variant === 'CHESS960' && game.chess960Position) {
      try {
        const chess960Pos = getChess960Position(game.chess960Position);
        initialFen = chess960Pos.fen;
      } catch (error) {
        console.error('Error computing Chess960 FEN:', error);
      }
    }

    const formattedGame = {
      id: game.id,
      tc: game.tc === 'ONE_PLUS_ZERO' ? '1+0' : '2+0',
      result: game.result || 'unknown',
      rated: game.rated,
      startedAt: game.startedAt?.toISOString() || new Date().toISOString(),
      endedAt: game.endedAt?.toISOString() || null,
      whiteId: game.whiteId,
      blackId: game.blackId,
      whiteHandle: game.white?.handle || 'Anonymous',
      blackHandle: game.black?.handle || 'Anonymous',
      whiteRatingBefore: game.whiteRatingBefore || 1500,
      blackRatingBefore: game.blackRatingBefore || 1500,
      whiteRatingAfter: game.whiteRatingAfter || 1500,
      blackRatingAfter: game.blackRatingAfter || 1500,
      moves: game.moves.map(move => move.uci),
      moveCount: game.moves.length,
      duration: game.startedAt && game.endedAt
        ? Math.round((game.endedAt.getTime() - game.startedAt.getTime()) / 1000)
        : null,
      chess960Position: game.chess960Position,
      variant: game.variant,
      initialFen,
    };

    return NextResponse.json({ game: formattedGame });
  } catch (error) {
    console.error('Game fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
