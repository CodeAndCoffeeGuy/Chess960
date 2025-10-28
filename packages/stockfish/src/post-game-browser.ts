/**
 * Browser-based post-game analysis
 * Runs entirely in the user's browser using WebAssembly Stockfish
 */

import { Chess } from 'chess.js';
import { StockfishBrowser } from './stockfish-browser';
import { calculateAccuracy } from './accuracy';

export interface PostGameMove {
  ply: number;
  move: string;
  san: string;
  evaluation: {
    cp?: number;
    mate?: number;
    depth: number;
    bestMove?: string;
  };
  accuracy?: {
    accuracy: number;
    classification: 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder' | 'missed-win';
    winPercent: number;
    winPercentLoss: number;
  };
  isBook: boolean;
}

export interface PostGameAnalysis {
  moves: PostGameMove[];
  accuracy: {
    white: number;
    black: number;
    overall: number;
  };
  classifications: {
    white: {
      excellent: number;
      good: number;
      inaccuracy: number;
      mistake: number;
      blunder: number;
    };
    black: {
      excellent: number;
      good: number;
      inaccuracy: number;
      mistake: number;
      blunder: number;
    };
  };
  opening: {
    name: string;
    eco?: string;
    ply: number;
  };
  result: string;
  criticalMoments: PostGameMove[];
}

export interface AnalysisProgress {
  current: number;
  total: number;
  currentMove: string;
}

export class PostGameBrowserAnalyzer {
  private engine: StockfishBrowser;
  private onProgress?: (_progress: AnalysisProgress) => void;

  constructor(onProgress?: (_progress: AnalysisProgress) => void) {
    this.engine = new StockfishBrowser();
    this.onProgress = onProgress;
  }

  async analyzeGame(
    pgn: string,
    options: {
      depth?: number;
      includeBook?: boolean;
      skipOpeningMoves?: number;
      initialFen?: string;
    } = {}
  ): Promise<PostGameAnalysis> {
    const {
      depth = 12, // Lower depth for faster browser analysis
      skipOpeningMoves = 6,
      initialFen
    } = options;

    const chess = new Chess();
    chess.loadPgn(pgn);

    const history = chess.history({ verbose: true });
    const moves: PostGameMove[] = [];

    // Reset to start - use Chess960 FEN if provided
    if (initialFen) {
      chess.load(initialFen);
    } else {
      chess.reset();
    }

    // Analyze starting position
    let currentEval: number = 0;
    let currentDepth: number = 0;
    const totalMoves = history.length;

    try {
      const startAnalysis = await this.engine.analyzePosition(chess.fen(), { depth });
      currentEval = startAnalysis.evaluation;
      currentDepth = startAnalysis.depth;
    } catch (error) {
      console.warn('Failed to analyze starting position:', error);
    }

    // Analyze each move
    for (let i = 0; i < history.length; i++) {
      const move = history[i];
      const ply = i + 1;

      // Report progress
      if (this.onProgress) {
        this.onProgress({
          current: i + 1,
          total: totalMoves,
          currentMove: move.san
        });
      }

      // Skip book moves (first N moves)
      const isBook = i < skipOpeningMoves;

      // Store the evaluation BEFORE this move (for accuracy calculation)
      const evalBeforeMove = currentEval;

      // Make the move on the board
      chess.move(move);

      // Analyze position AFTER the move
      let evalAfterMove: number = 0;
      let mateScore: number | undefined = undefined;
      let depthUsed = depth;
      let bestMoveUci: string | undefined = undefined;

      if (!isBook) {
        try {
          // Check if the position is checkmate
          if (chess.isCheckmate()) {
            // It's checkmate - set mate score
            const winner = chess.turn() === 'w' ? 'black' : 'white';
            mateScore = winner === 'white' ? 0 : 0; // M0 for display
            // For accuracy calculation, use a mate score in Stockfish format
            // Mate in 0 from white's perspective is mate +1, from black's is mate -1
            evalAfterMove = winner === 'white' ? 999 : -999; // Use clamped mate value
            depthUsed = currentDepth;
          } else {
            // Not checkmate, analyze normally
            const analysisAfter = await this.engine.analyzePosition(chess.fen(), { depth });
            evalAfterMove = analysisAfter.evaluation;
            depthUsed = analysisAfter.depth;
            bestMoveUci = analysisAfter.bestMove.uci;
          }
        } catch (error) {
          console.warn(`Failed to analyze position after move ${i + 1}:`, error);
          evalAfterMove = evalBeforeMove;
          depthUsed = 0;
        }
      }

      // Calculate accuracy if not a book move and we have a previous eval to compare
      let accuracy: PostGameMove['accuracy'] | undefined;
      if (!isBook && i >= skipOpeningMoves) {
        const color = ply % 2 === 1 ? 'white' : 'black';
        const beforeEval = { cp: evalBeforeMove };
        const afterEval = { cp: evalAfterMove, mate: mateScore };

        console.log(`[Analysis Debug] Move ${ply} (${move.san}):`, {
          color,
          evalBeforeMove,
          evalAfterMove,
          mateScore
        });

        accuracy = calculateAccuracy(beforeEval, afterEval, color);

        console.log(`[Analysis Debug] Accuracy result:`, {
          accuracy: accuracy.accuracy,
          classification: accuracy.classification,
          winPercentLoss: accuracy.winPercentLoss
        });
      }

      // Store the move with evaluation AFTER the move (what the user sees)
      moves.push({
        ply,
        move: move.from + move.to + (move.promotion || ''),
        san: move.san,
        evaluation: {
          cp: mateScore === undefined ? evalAfterMove : undefined,
          mate: mateScore,
          depth: depthUsed,
          bestMove: bestMoveUci
        },
        accuracy,
        isBook
      });

      // Update current eval for next iteration
      currentEval = evalAfterMove;
      currentDepth = depthUsed;
    }

    // Calculate statistics
    const whiteAccuracies = moves
      .filter((m, i) => i % 2 === 0 && m.accuracy)
      .map(m => m.accuracy!.accuracy);
    const blackAccuracies = moves
      .filter((m, i) => i % 2 === 1 && m.accuracy)
      .map(m => m.accuracy!.accuracy);

    const avgAccuracy = (arr: number[]) =>
      arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    const whiteAccuracy = avgAccuracy(whiteAccuracies);
    const blackAccuracy = avgAccuracy(blackAccuracies);

    // Count move classifications
    const countClassifications = (color: 'white' | 'black') => {
      const filtered = moves.filter((m, i) => {
        const isWhite = i % 2 === 0;
        return color === 'white' ? isWhite : !isWhite;
      });

      return {
        excellent: filtered.filter(m => m.accuracy?.classification === 'excellent').length,
        good: filtered.filter(m => m.accuracy?.classification === 'good').length,
        inaccuracy: filtered.filter(m => m.accuracy?.classification === 'inaccuracy').length,
        mistake: filtered.filter(m => m.accuracy?.classification === 'mistake').length,
        blunder: filtered.filter(m => m.accuracy?.classification === 'blunder').length,
      };
    };

    // Find critical moments (big evaluation swings)
    const criticalMoments = moves
      .filter(m => m.accuracy && m.accuracy.winPercentLoss > 10)
      .sort((a, b) => (b.accuracy?.winPercentLoss || 0) - (a.accuracy?.winPercentLoss || 0))
      .slice(0, 5);

    return {
      moves,
      accuracy: {
        white: whiteAccuracy,
        black: blackAccuracy,
        overall: avgAccuracy([...whiteAccuracies, ...blackAccuracies])
      },
      classifications: {
        white: countClassifications('white'),
        black: countClassifications('black')
      },
      opening: {
        name: 'Standard Opening', // TODO: Add opening detection
        ply: skipOpeningMoves
      },
      result: chess.isCheckmate() ?
        (chess.turn() === 'w' ? '0-1' : '1-0') :
        chess.isDraw() ? '1/2-1/2' : '*',
      criticalMoments
    };
  }

  private evalToWinPercent(cp: number): number {
    // Convert centipawns to win percentage using formula
    return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1);
  }

  private classifyMove(
    winPercentLoss: number
  ): 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder' {
    if (winPercentLoss < 2) return 'excellent';
    if (winPercentLoss < 5) return 'good';
    if (winPercentLoss < 10) return 'inaccuracy';
    if (winPercentLoss < 20) return 'mistake';
    return 'blunder';
  }

  destroy(): void {
    this.engine.destroy();
  }
}
