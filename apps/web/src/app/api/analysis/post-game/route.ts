import { NextRequest, NextResponse } from 'next/server';
import { PostGameAnalyzer } from '@chess960/stockfish';

// Configure for longer execution time (60 seconds max on Vercel Pro)
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  let analyzer: PostGameAnalyzer | null = null;

  try {
    // Use lower default depth for faster analysis (12 instead of 18)
    const { pgn, depth = 12, includeBook = false, skipOpeningMoves = 6 } = await request.json();

    if (!pgn) {
      return NextResponse.json(
        { error: 'PGN is required' },
        { status: 400 }
      );
    }

    if (typeof depth !== 'number' || depth < 10 || depth > 25) {
      return NextResponse.json(
        { error: 'Depth must be a number between 10 and 25' },
        { status: 400 }
      );
    }

    // Initialize Stockfish analyzer
    analyzer = new PostGameAnalyzer();

    // Perform actual Stockfish analysis
    const postGameAnalysis = await analyzer.analyzeGame(pgn, {
      depth,
      includeBook,
      skipOpeningMoves
    });

    // Clean up analyzer
    await analyzer.destroy();
    analyzer = null;

    return NextResponse.json({
      analysis: postGameAnalysis,
      depth,
      includeBook,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Post-game analysis error:', error);

    // Clean up analyzer on error
    if (analyzer) {
      try {
        await analyzer.destroy();
      } catch (cleanupError) {
        console.error('Error cleaning up analyzer:', cleanupError);
      }
    }

    return NextResponse.json(
      {
        error: 'Post-game analysis failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}