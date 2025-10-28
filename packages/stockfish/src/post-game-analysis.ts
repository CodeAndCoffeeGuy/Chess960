import { Chess } from 'chess.js';
import { StockfishEngine } from './stockfish-engine';
import { 
  calculateAccuracy, 
  calculateOverallAccuracy, 
  isBookPosition,
  type AccuracyData 
} from './accuracy';

export interface PostGameMove {
  ply: number;
  move: string;
  san: string;
  uci: string;
  fen: string;
  evaluation: {
    cp?: number;
    mate?: number;
    depth: number;
    bestMove?: string;
  };
  accuracy?: AccuracyData;
  isBook: boolean;
  timeSpent?: number;
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
  phases: {
    opening: { start: number; end: number };
    middlegame: { start: number; end: number };
    endgame: { start: number; end: number };
  };
  result: string;
  duration: number;
  criticalMoments: PostGameMove[];
}

export class PostGameAnalyzer {
  private engine: StockfishEngine;

  constructor() {
    this.engine = new StockfishEngine();
  }

  /**
   * Perform complete post-game analysis
   */
  async analyzeGame(
    pgn: string, 
    options: { 
      depth?: number; 
      includeBook?: boolean;
      skipOpeningMoves?: number;
    } = {}
  ): Promise<PostGameAnalysis> {
    const { depth = 18, includeBook = false, skipOpeningMoves = 6 } = options;
    
    const chess = new Chess();
    chess.loadPgn(pgn);
    
    const gameHistory = chess.history({ verbose: true });
    const startTime = Date.now();
    
    // Reset to analyze from start
    chess.reset();
    
    const moves: PostGameMove[] = [];
    const whiteAccuracies: number[] = [];
    const blackAccuracies: number[] = [];
    
    // Analyze each position
    for (let i = 0; i < gameHistory.length; i++) {
      const move = gameHistory[i];
      const currentFen = chess.fen();
      const isWhiteMove = chess.turn() === 'w';
      
      // Skip book moves if requested
      if (!includeBook && i < skipOpeningMoves) {
        chess.move(move);
        continue;
      }
      
      // Get evaluation before the move
      const beforeEval = await this.engine.getPositionEvaluation(currentFen, depth);
      
      // Make the move
      chess.move(move);
      const afterFen = chess.fen();
      
      // Get evaluation after the move
      const afterEval = await this.engine.getPositionEvaluation(afterFen, depth);
      
      // Calculate accuracy
      let accuracy: AccuracyData | undefined;
      if (beforeEval.evaluation !== undefined) {
        accuracy = calculateAccuracy(
          { cp: beforeEval.evaluation },
          { cp: afterEval.evaluation },
          isWhiteMove ? 'white' : 'black'
        );
        
        // Track accuracies by color
        if (isWhiteMove) {
          whiteAccuracies.push(accuracy.accuracy);
        } else {
          blackAccuracies.push(accuracy.accuracy);
        }
      }
      
      const gameMove: PostGameMove = {
        ply: i + 1,
        move: move.san,
        san: move.san,
        uci: move.from + move.to + (move.promotion || ''),
        fen: afterFen,
        evaluation: {
          cp: afterEval.evaluation,
          depth: afterEval.depth,
          bestMove: beforeEval.bestMove
        },
        accuracy,
        isBook: isBookPosition(i + 1, { cp: beforeEval.evaluation })
      };
      
      moves.push(gameMove);
    }
    
    // Calculate overall accuracies
    const whiteAccuracy = calculateOverallAccuracy(whiteAccuracies);
    const blackAccuracy = calculateOverallAccuracy(blackAccuracies);
    const overallAccuracy = calculateOverallAccuracy([...whiteAccuracies, ...blackAccuracies]);
    
    // Count classifications
    const classifications = this.countClassifications(moves);
    
    // Detect game phases
    const phases = this.detectGamePhases(moves);
    
    // Find critical moments (big evaluation swings)
    const criticalMoments = this.findCriticalMoments(moves);
    
    // Get opening information
    const opening = this.detectOpening(moves);
    
    return {
      moves,
      accuracy: {
        white: whiteAccuracy,
        black: blackAccuracy,
        overall: overallAccuracy
      },
      classifications,
      opening,
      phases,
      result: this.getGameResult(chess),
      duration: Date.now() - startTime,
      criticalMoments
    };
  }

  /**
   * Count move classifications by color
   */
  private countClassifications(moves: PostGameMove[]) {
    const classifications = {
      white: { excellent: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 },
      black: { excellent: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 }
    };

    moves.forEach((move, index) => {
      if (!move.accuracy) return;
      
      const color = index % 2 === 0 ? 'white' : 'black';
      const type = move.accuracy.classification;
      
      if (type in classifications[color]) {
        (classifications[color] as Record<string, number>)[type]++;
      }
    });

    return classifications;
  }

  /**
   * Detect game phases based on material and move count
   */
  private detectGamePhases(moves: PostGameMove[]) {
    // Simplified phase detection
    const totalMoves = moves.length;
    const openingEnd = Math.min(20, Math.floor(totalMoves * 0.25));
    const endgameStart = Math.max(openingEnd + 10, Math.floor(totalMoves * 0.7));
    
    return {
      opening: { start: 1, end: openingEnd },
      middlegame: { start: openingEnd + 1, end: endgameStart },
      endgame: { start: endgameStart + 1, end: totalMoves }
    };
  }

  /**
   * Find critical moments (large evaluation swings)
   */
  private findCriticalMoments(moves: PostGameMove[]): PostGameMove[] {
    const critical: PostGameMove[] = [];
    
    for (let i = 1; i < moves.length; i++) {
      const prevMove = moves[i - 1];
      const currentMove = moves[i];
      
      if (!prevMove.evaluation.cp || !currentMove.evaluation.cp) continue;
      
      const evalSwing = Math.abs(currentMove.evaluation.cp - prevMove.evaluation.cp);
      
      // Consider moves with >150cp swing or blunders as critical
      if (evalSwing > 150 || currentMove.accuracy?.classification === 'blunder') {
        critical.push(currentMove);
      }
    }
    
    return critical.slice(0, 5); // Limit to 5 most critical moments
  }

  /**
   * Basic opening detection
   */
  private detectOpening(moves: PostGameMove[]) {
    // This would normally use an opening database
    // For now, return basic classification based on first moves
    if (moves.length === 0) {
      return { name: 'Unknown', ply: 0 };
    }
    
    const firstMove = moves[0]?.san || '';
    
    const basicOpenings: Record<string, string> = {
      'e4': 'King\'s Pawn Game',
      'd4': 'Queen\'s Pawn Game', 
      'Nf3': 'Réti Opening',
      'c4': 'English Opening',
      'f4': 'Bird\'s Opening',
      'b3': 'Nimzo-Larsen Attack',
      'g3': 'King\'s Indian Attack'
    };
    
    return {
      name: basicOpenings[firstMove] || 'Unknown Opening',
      ply: moves.findIndex(m => !m.isBook) || 10
    };
  }

  /**
   * Get game result
   */
  private getGameResult(chess: Chess): string {
    if (chess.isCheckmate()) {
      return chess.turn() === 'w' ? '0-1' : '1-0';
    }
    
    if (chess.isDraw() || chess.isStalemate() || 
        chess.isThreefoldRepetition() || chess.isInsufficientMaterial()) {
      return '1/2-1/2';
    }
    
    return '*';
  }

  /**
   * Clean up resources
   */
  async destroy(): Promise<void> {
    this.engine.destroy();
  }
}