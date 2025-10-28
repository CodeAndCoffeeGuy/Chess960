import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { fen, timeMs = 3000 } = await request.json();

    if (!fen) {
      return NextResponse.json(
        { error: 'FEN position is required' },
        { status: 400 }
      );
    }

    // Validate FEN format (basic check)
    const fenParts = fen.split(' ');
    if (fenParts.length < 4) {
      return NextResponse.json(
        { error: 'Invalid FEN format' },
        { status: 400 }
      );
    }

    // Validate time parameter
    if (typeof timeMs !== 'number' || timeMs < 100 || timeMs > 30000) {
      return NextResponse.json(
        { error: 'Time must be between 100ms and 30000ms' },
        { status: 400 }
      );
    }

    // In a real implementation, this would connect to your analysis service
    // For now, simulate a best move response
    const bestMoveResult = {
      bestMove: 'e2e4',
      evaluation: 0.3,
      time: timeMs,
      confidence: 95.2
    };

    return NextResponse.json({
      fen,
      result: bestMoveResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Best move analysis error:', error);
    return NextResponse.json(
      { error: 'Best move analysis failed' },
      { status: 500 }
    );
  }
}