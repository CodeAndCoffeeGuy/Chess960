import { Chess } from 'chess.js';
import { StockfishEngine } from './stockfish-engine';
import { GameAnalysis, PositionAnalysis } from './types';

export class GameAnalyzer {
  private engine: StockfishEngine;

  constructor() {
    this.engine = new StockfishEngine();
  }

  async analyzeGame(pgn: string, depth: number = 12, initialFen?: string): Promise<GameAnalysis> {
    const chess = new Chess();
    const moves: GameAnalysis['moves'] = [];
    let whiteAccuracySum = 0;
    let blackAccuracySum = 0;
    let whiteMoves = 0;
    let blackMoves = 0;

    try {
      chess.loadPgn(pgn);
      const history = chess.history({ verbose: true });
      
      // Reset to starting position - use Chess960 FEN if provided
      if (initialFen) {
        chess.load(initialFen);
      } else {
        chess.reset();
      }

      for (let i = 0; i < history.length; i++) {
        const move = history[i];
        const currentFen = chess.fen();
        
        // Get best move for current position
        const analysis = await this.engine.getPositionEvaluation(currentFen, depth);
        
        // Make the actual move that was played
        chess.move(move);
        
        // Get evaluation after the move
        const afterMoveFen = chess.fen();
        const afterMoveAnalysis = await this.engine.getPositionEvaluation(afterMoveFen, depth);
        
        // Calculate accuracy and classification
        const accuracy = this.calculateAccuracy(analysis.evaluation, afterMoveAnalysis.evaluation, chess.turn() === 'w' ? 'black' : 'white');
        const classification = this.classifyMove(accuracy);
        
        moves.push({
          move: move.san,
          evaluation: afterMoveAnalysis.evaluation,
          bestMove: this.parseUciToSan(chess, analysis.bestMove, currentFen),
          accuracy,
          classification
        });

        // Track accuracy by color
        if (chess.turn() === 'w') {
          blackAccuracySum += accuracy;
          blackMoves++;
        } else {
          whiteAccuracySum += accuracy;
          whiteMoves++;
        }
      }

      return {
        moves,
        averageAccuracy: {
          white: whiteMoves > 0 ? whiteAccuracySum / whiteMoves : 0,
          black: blackMoves > 0 ? blackAccuracySum / blackMoves : 0
        },
        gameResult: this.getGameResult(chess),
        openingName: this.getOpeningName(chess)
      };
    } catch (error) {
      console.error('Game analysis error:', error);
      throw new Error(`Failed to analyze game: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async analyzePositions(fens: string[], depth: number = 15): Promise<PositionAnalysis[]> {
    const analyses: PositionAnalysis[] = [];
    
    for (const fen of fens) {
      try {
        const analysis = await this.engine.getPositionEvaluation(fen, depth);
        analyses.push(analysis);
      } catch (error) {
        console.error(`Failed to analyze position ${fen}:`, error);
        analyses.push({
          fen,
          evaluation: 0,
          bestMove: '',
          pv: [],
          depth: 0,
          isBookPosition: false
        });
      }
    }
    
    return analyses;
  }

  private calculateAccuracy(beforeEval: number, afterEval: number, side: 'white' | 'black'): number {
    // Convert centipawn evaluation to accuracy percentage
    // Formula based on Chess960 accuracy calculation
    const winChanceBefore = this.evalToWinChance(side === 'white' ? beforeEval : -beforeEval);
    const winChanceAfter = this.evalToWinChance(side === 'white' ? afterEval : -afterEval);
    
    const winChanceLoss = Math.max(0, winChanceBefore - winChanceAfter);
    return Math.max(0, Math.min(100, 103.1668 * Math.exp(-0.04354 * winChanceLoss) - 3.1669));
  }

  private evalToWinChance(evaluation: number): number {
    // Convert centipawn evaluation to win probability
    return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * evaluation)) - 1);
  }

  private classifyMove(accuracy: number): 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder' {
    if (accuracy >= 96) return 'excellent';
    if (accuracy >= 90) return 'good';
    if (accuracy >= 80) return 'inaccuracy';
    if (accuracy >= 60) return 'mistake';
    return 'blunder';
  }

  private parseUciToSan(chess: Chess, uci: string, fen: string): string {
    try {
      const tempChess = new Chess(fen);
      const move = tempChess.move({
        from: uci.substring(0, 2),
        to: uci.substring(2, 4),
        promotion: uci.length === 5 ? uci[4] as 'q' | 'r' | 'b' | 'n' : undefined
      });
      return move ? move.san : uci;
    } catch {
      return uci;
    }
  }

  private getGameResult(chess: Chess): string {
    if (chess.isCheckmate()) {
      return chess.turn() === 'w' ? '0-1' : '1-0';
    }
    if (chess.isDraw() || chess.isStalemate() || chess.isThreefoldRepetition() || chess.isInsufficientMaterial()) {
      return '1/2-1/2';
    }
    return '*'; // Game in progress
  }

  private getOpeningName(chess: Chess): string {
    // This is a simplified opening detection
    // In a real implementation, you'd use an opening book database
    const moveHistory = chess.history();
    
    if (moveHistory.length < 2) return 'Starting position';
    
    // Some basic opening patterns
    const openingPatterns: { [key: string]: string } = {
      'e4 e5': 'King\'s Pawn Game',
      'e4 c5': 'Sicilian Defense',
      'd4 d5': 'Queen\'s Pawn Game',
      'd4 Nf6': 'Indian Defense',
      'Nf3 Nf6': 'Réti Opening',
      'c4': 'English Opening',
      'f4': 'Bird\'s Opening',
      'b3': 'Larsen Attack'
    };

    const firstMoves = moveHistory.slice(0, 2).join(' ');
    return openingPatterns[firstMoves] || 'Unknown Opening';
  }

  async destroy(): Promise<void> {
    this.engine.destroy();
  }
}