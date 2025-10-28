import { NextRequest, NextResponse } from 'next/server';
import { StockfishEngine } from '@chess960/stockfish';

export async function POST(request: NextRequest) {
  let engine: StockfishEngine | null = null;

  try {
    const { fen, depth = 18 } = await request.json();

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

    // Initialize Stockfish engine
    engine = new StockfishEngine();

    // Wait for engine to be ready
    const ready = await engine.isReady();
    if (!ready) {
      throw new Error('Stockfish engine failed to initialize');
    }

    // Get position evaluation from Stockfish
    const analysisResult = await engine.getPositionEvaluation(fen, depth);

    // Clean up engine
    engine.destroy();
    engine = null;

    return NextResponse.json({
      fen,
      result: analysisResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Position analysis error:', error);

    // Clean up engine on error
    if (engine) {
      try {
        engine.destroy();
      } catch (cleanupError) {
        console.error('Error cleaning up engine:', cleanupError);
      }
    }

    return NextResponse.json(
      {
        error: 'Analysis failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}