import { NextRequest, NextResponse } from 'next/server';
import { PostGameBrowserAnalyzer } from '@chess960/stockfish';

export async function POST(request: NextRequest) {
  try {
    const { pgn, moves, depth = 12, initialFen } = await request.json();

    if (!pgn && !moves) {
      return NextResponse.json(
        { error: 'PGN or moves array is required' },
        { status: 400 }
      );
    }

    if (moves && !Array.isArray(moves)) {
      return NextResponse.json(
        { error: 'Moves must be an array' },
        { status: 400 }
      );
    }

    // Validate depth parameter
    if (typeof depth !== 'number' || depth < 1 || depth > 20) {
      return NextResponse.json(
        { error: 'Depth must be a number between 1 and 20' },
        { status: 400 }
      );
    }

    // Convert moves array to PGN if needed
    let pgnToAnalyze = pgn;
    if (moves && !pgn) {
      // Simple conversion from UCI moves to PGN
      // This is a basic implementation - in production you'd want more robust conversion
      const chess = new (await import('chess.js')).Chess();
      const pgnMoves: string[] = [];
      
      for (const move of moves) {
        try {
          const moveObj = chess.move({
            from: move.substring(0, 2),
            to: move.substring(2, 4),
            promotion: move.length === 5 ? move[4] : undefined
          });
          if (moveObj) {
            pgnMoves.push(moveObj.san);
          }
        } catch {
          console.warn('Invalid move in sequence:', move);
        }
      }
      
      pgnToAnalyze = pgnMoves.join(' ');
    }

    if (!pgnToAnalyze) {
      return NextResponse.json(
        { error: 'Could not generate PGN from moves' },
        { status: 400 }
      );
    }

    // Use browser-based Stockfish analysis
    const analyzer = new PostGameBrowserAnalyzer();
    
    try {
      const analysis = await analyzer.analyzeGame(pgnToAnalyze, {
        depth,
        includeBook: false,
        skipOpeningMoves: 6,
        initialFen
      });

      // Clean up the analyzer
      analyzer.destroy();

      return NextResponse.json({
        analysis,
        depth,
        timestamp: new Date().toISOString()
      });
    } catch (analysisError) {
      analyzer.destroy();
      throw analysisError;
    }

  } catch (error) {
    console.error('Game analysis error:', error);
    return NextResponse.json(
      { error: 'Game analysis failed' },
      { status: 500 }
    );
  }
}