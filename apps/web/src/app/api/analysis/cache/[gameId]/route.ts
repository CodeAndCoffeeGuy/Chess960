import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@chess960/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;

    console.log('[API] Checking cache for gameId:', gameId);

    const cached = await prisma.gameAnalysis.findUnique({
      where: { gameId }
    });

    if (!cached) {
      console.log('[API] No cache found for gameId:', gameId);
      return NextResponse.json({ analysis: null }, { status: 404 });
    }

    console.log('[API] Cache found for gameId:', gameId);

    // Transform database format to PostGameAnalysis format
    const analysis = {
      moves: cached.moves,
      accuracy: cached.accuracy,
      classifications: cached.classifications,
      opening: cached.opening,
      result: cached.result,
      criticalMoments: cached.criticalMoments
    };

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('[API] Error fetching cached analysis:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cached analysis' },
      { status: 500 }
    );
  }
}
