import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@chess960/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gameId, analysis } = body;

    if (!gameId || !analysis) {
      return NextResponse.json(
        { error: 'Missing gameId or analysis data' },
        { status: 400 }
      );
    }

    console.log('[API] Saving analysis to cache for gameId:', gameId);

    // Use upsert to handle cases where analysis already exists
    const cached = await prisma.gameAnalysis.upsert({
      where: { gameId },
      create: {
        gameId,
        moves: analysis.moves,
        accuracy: analysis.accuracy,
        classifications: analysis.classifications,
        opening: analysis.opening,
        result: analysis.result,
        criticalMoments: analysis.criticalMoments,
        depth: 12
      },
      update: {
        moves: analysis.moves,
        accuracy: analysis.accuracy,
        classifications: analysis.classifications,
        opening: analysis.opening,
        result: analysis.result,
        criticalMoments: analysis.criticalMoments,
        depth: 12
      }
    });

    console.log('[API] Successfully cached analysis for gameId:', gameId);

    return NextResponse.json({ success: true, cached });
  } catch (error) {
    console.error('[API] Error caching analysis:', error);
    return NextResponse.json(
      { error: 'Failed to cache analysis' },
      { status: 500 }
    );
  }
}
