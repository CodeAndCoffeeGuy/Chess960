import { db } from '@chess960/db';
import { ChessEngine } from '../game/chess-engine';

export interface MoveAnalysis {
  uci: string;
  timeToMove: number; // milliseconds
  complexity: number; // 0-100, higher = more complex position
  accuracy: number; // 0-100, higher = better move
  isBlunder: boolean;
  isBrilliant: boolean;
}

export interface FairplayReport {
  userId: string;
  gameId: string;
  suspicionLevel: number; // 0-100
  flags: string[];
  moveAnalysis: MoveAnalysis[];
  patterns: {
    consistentTiming: number; // 0-100, higher = more suspicious
    accuracySpikes: number; // 0-100
    complexMoveSpeed: number; // 0-100
    engineCorrelation: number; // 0-100
  };
}

export class FairplayDetector {
  
  async analyzeGame(gameId: string, moves: string[], moveTimes: number[]): Promise<FairplayReport[]> {
    if (moves.length !== moveTimes.length) {
      console.warn('Move/time arrays length mismatch for game:', gameId);
      return [];
    }

    const reports: FairplayReport[] = [];
    
    try {
      // Get game and player info
      const game = await db.game.findUnique({
        where: { id: gameId },
        include: {
          white: { select: { id: true, handle: true } },
          black: { select: { id: true, handle: true } },
        },
      });

      if (!game || !game.white || !game.black) {
        console.warn('Game not found or missing players:', gameId);
        return [];
      }

      // Analyze each player's moves
      const whiteAnalysis = await this.analyzePlayerMoves(
        game.white.id,
        gameId,
        moves.filter((_, i) => i % 2 === 0), // White moves (even indices)
        moveTimes.filter((_, i) => i % 2 === 0) // White move times
      );

      const blackAnalysis = await this.analyzePlayerMoves(
        game.black.id,
        gameId,
        moves.filter((_, i) => i % 2 === 1), // Black moves (odd indices)
        moveTimes.filter((_, i) => i % 2 === 1) // Black move times
      );

      reports.push(whiteAnalysis, blackAnalysis);

      // Save suspicious reports to database
      for (const report of reports) {
        if (report.suspicionLevel > 30) { // Threshold for saving
          await this.saveFairplayFlag(report);
        }
      }

      return reports;

    } catch (error) {
      console.error('Fairplay analysis failed for game:', gameId, error);
      return [];
    }
  }

  private async analyzePlayerMoves(
    userId: string,
    gameId: string,
    playerMoves: string[],
    playerTimes: number[]
  ): Promise<FairplayReport> {
    const moveAnalysis: MoveAnalysis[] = [];
    const engine = new ChessEngine();
    
    // Analyze each move
    for (let i = 0; i < playerMoves.length; i++) {
      const move = playerMoves[i];
      const timeToMove = playerTimes[i];
      
      const analysis = await this.analyzeSingleMove(engine, move, timeToMove);
      moveAnalysis.push(analysis);
      
      // Make the move on the engine
      if (!engine.makeMove(move)) {
        console.warn(`Invalid move in analysis: ${move}`);
        break;
      }
    }

    // Calculate patterns
    const patterns = this.detectPatterns(moveAnalysis);
    
    // Calculate overall suspicion level
    const suspicionLevel = this.calculateSuspicionLevel(patterns, moveAnalysis);
    
    // Generate flags
    const flags = this.generateFlags(patterns, moveAnalysis, suspicionLevel);

    return {
      userId,
      gameId,
      suspicionLevel: Math.round(suspicionLevel),
      flags,
      moveAnalysis,
      patterns,
    };
  }

  private async analyzeSingleMove(
    engine: ChessEngine,
    uci: string,
    timeToMove: number
  ): Promise<MoveAnalysis> {
    // Get legal moves for complexity calculation
    const legalMoves = engine.getLegalMoves();
    const complexity = this.calculatePositionComplexity(legalMoves.length, engine.isInCheck());
    
    // Simple move evaluation (in a real implementation, you'd use a proper engine)
    const accuracy = this.evaluateMoveAccuracy(engine, uci, legalMoves);
    
    // Detect blunders and brilliant moves (simplified)
    const isBlunder = accuracy < 20 && complexity > 30;
    const isBrilliant = accuracy > 90 && complexity > 70;

    return {
      uci,
      timeToMove,
      complexity,
      accuracy,
      isBlunder,
      isBrilliant,
    };
  }

  private calculatePositionComplexity(legalMoves: number, inCheck: boolean): number {
    // Simple complexity calculation based on number of legal moves and check
    let complexity = Math.min(legalMoves * 2, 100);
    if (inCheck) complexity += 20;
    return Math.min(complexity, 100);
  }

  private evaluateMoveAccuracy(engine: ChessEngine, move: string, legalMoves: string[]): number {
    // Very simplified move evaluation
    // In a real implementation, you'd use a chess engine like Stockfish
    
    if (!legalMoves.includes(move)) {
      return 0; // Illegal move
    }

    // Basic heuristics
    let score = 50; // Base score
    
    // Favor center control (simplified)
    const toSquare = move.slice(2, 4);
    if (['e4', 'e5', 'd4', 'd5', 'c4', 'c5', 'f4', 'f5'].includes(toSquare)) {
      score += 15;
    }
    
    // Capture bonus (if move length > 4, it might be a capture with promotion)
    if (this.isCapture(engine, move)) {
      score += 10;
    }
    
    // Check bonus
    const testEngine = engine.clone();
    testEngine.makeMove(move);
    if (testEngine.isInCheck()) {
      score += 10;
    }

    return Math.min(Math.max(score, 0), 100);
  }

  private isCapture(engine: ChessEngine, move: string): boolean {
    // Simple capture detection - in a real implementation this would be more sophisticated
    const _fromSquare = move.slice(0, 2);
    const _toSquare = move.slice(2, 4);
    
    // This is a simplified check - you'd need to actually check the board position
    return false; // Placeholder
  }

  private detectPatterns(moveAnalysis: MoveAnalysis[]): {
    consistentTiming: number;
    accuracySpikes: number;
    complexMoveSpeed: number;
    engineCorrelation: number;
  } {
    if (moveAnalysis.length < 5) {
      return { consistentTiming: 0, accuracySpikes: 0, complexMoveSpeed: 0, engineCorrelation: 0 };
    }

    // Consistent timing pattern detection
    const times = moveAnalysis.map(m => m.timeToMove);
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const timeVariance = times.reduce((acc, time) => acc + Math.pow(time - avgTime, 2), 0) / times.length;
    const consistentTiming = timeVariance < 500 ? Math.min((1000 - timeVariance) / 10, 100) : 0;

    // Accuracy spikes (sudden improvement in difficult positions)
    let accuracySpikes = 0;
    for (let i = 1; i < moveAnalysis.length; i++) {
      const current = moveAnalysis[i];
      const previous = moveAnalysis[i - 1];
      
      if (current.complexity > 70 && current.accuracy > 85 && previous.accuracy < 60) {
        accuracySpikes += 20;
      }
    }
    accuracySpikes = Math.min(accuracySpikes, 100);

    // Complex move speed (playing difficult moves too quickly)
    const complexMoves = moveAnalysis.filter(m => m.complexity > 60);
    const fastComplexMoves = complexMoves.filter(m => m.timeToMove < 2000); // Less than 2 seconds
    const complexMoveSpeed = complexMoves.length > 0 
      ? Math.min((fastComplexMoves.length / complexMoves.length) * 100, 100) 
      : 0;

    // Engine correlation (consistently playing top moves)
    const highAccuracyMoves = moveAnalysis.filter(m => m.accuracy > 80).length;
    const engineCorrelation = moveAnalysis.length > 0 
      ? Math.min((highAccuracyMoves / moveAnalysis.length) * 100, 100)
      : 0;

    return {
      consistentTiming: Math.round(consistentTiming),
      accuracySpikes: Math.round(accuracySpikes),
      complexMoveSpeed: Math.round(complexMoveSpeed),
      engineCorrelation: Math.round(engineCorrelation),
    };
  }

  private calculateSuspicionLevel(
    patterns: { consistentTiming: number; accuracySpikes: number; complexMoveSpeed: number; engineCorrelation: number },
    moveAnalysis: MoveAnalysis[]
  ): number {
    const weights = {
      consistentTiming: 0.15,
      accuracySpikes: 0.25,
      complexMoveSpeed: 0.35,
      engineCorrelation: 0.25,
    };

    const weightedScore = 
      patterns.consistentTiming * weights.consistentTiming +
      patterns.accuracySpikes * weights.accuracySpikes +
      patterns.complexMoveSpeed * weights.complexMoveSpeed +
      patterns.engineCorrelation * weights.engineCorrelation;

    // Additional penalties for suspicious patterns
    let penalties = 0;
    
    // Too many brilliant moves
    const brilliantMoves = moveAnalysis.filter(m => m.isBrilliant).length;
    if (brilliantMoves > 3 && moveAnalysis.length > 10) {
      penalties += 20;
    }

    // No blunders in complex game
    const blunders = moveAnalysis.filter(m => m.isBlunder).length;
    const avgComplexity = moveAnalysis.reduce((sum, m) => sum + m.complexity, 0) / moveAnalysis.length;
    if (blunders === 0 && avgComplexity > 50 && moveAnalysis.length > 15) {
      penalties += 15;
    }

    return Math.min(weightedScore + penalties, 100);
  }

  private generateFlags(
    patterns: { consistentTiming: number; accuracySpikes: number; complexMoveSpeed: number; engineCorrelation: number },
    moveAnalysis: MoveAnalysis[],
    suspicionLevel: number
  ): string[] {
    const flags: string[] = [];

    if (patterns.consistentTiming > 70) {
      flags.push('CONSISTENT_TIMING');
    }

    if (patterns.accuracySpikes > 60) {
      flags.push('ACCURACY_SPIKES');
    }

    if (patterns.complexMoveSpeed > 50) {
      flags.push('FAST_COMPLEX_MOVES');
    }

    if (patterns.engineCorrelation > 75) {
      flags.push('HIGH_ENGINE_CORRELATION');
    }

    const brilliantCount = moveAnalysis.filter(m => m.isBrilliant).length;
    if (brilliantCount > 3) {
      flags.push('TOO_MANY_BRILLIANT_MOVES');
    }

    const blunderCount = moveAnalysis.filter(m => m.isBlunder).length;
    if (blunderCount === 0 && moveAnalysis.length > 15) {
      flags.push('NO_BLUNDERS');
    }

    if (suspicionLevel > 80) {
      flags.push('HIGH_SUSPICION');
    }

    return flags;
  }

  private async saveFairplayFlag(report: FairplayReport): Promise<void> {
    try {
      await db.fairplayFlag.create({
        data: {
          userId: report.userId,
          gameId: report.gameId,
          reason: report.flags.join(', '),
          score: report.suspicionLevel,
        },
      });

      console.log(`Fairplay flag created for user ${report.userId} in game ${report.gameId} (score: ${report.suspicionLevel})`);
    } catch (error) {
      console.error('Failed to save fairplay flag:', error);
    }
  }

  // Get user's fairplay history
  async getUserFairplayHistory(userId: string): Promise<any[]> {
    try {
      return await db.fairplayFlag.findMany({
        where: { userId },
        include: {
          game: {
            select: {
              id: true,
              tc: true,
              result: true,
              startedAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    } catch (error) {
      console.error('Failed to get fairplay history:', error);
      return [];
    }
  }

  // Check if user has recent suspicious activity
  async hasRecentSuspiciousActivity(userId: string, daysBack = 7): Promise<boolean> {
    try {
      const cutoff = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
      
      const recentFlags = await db.fairplayFlag.count({
        where: {
          userId,
          createdAt: { gte: cutoff },
          score: { gte: 50 },
        },
      });

      return recentFlags > 2; // More than 2 flags in the last week
    } catch (error) {
      console.error('Failed to check recent suspicious activity:', error);
      return false;
    }
  }

  // Admin function to get overall fairplay statistics
  async getFairplayStatistics(): Promise<any> {
    try {
      const [totalFlags, highSuspicionFlags, recentFlags] = await Promise.all([
        db.fairplayFlag.count(),
        db.fairplayFlag.count({ where: { score: { gte: 70 } } }),
        db.fairplayFlag.count({ 
          where: { 
            createdAt: { 
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) 
            } 
          } 
        }),
      ]);

      return {
        totalFlags,
        highSuspicionFlags,
        recentFlags,
        flagRate: totalFlags > 0 ? Math.round((highSuspicionFlags / totalFlags) * 100) : 0,
      };
    } catch (error) {
      console.error('Failed to get fairplay statistics:', error);
      return { totalFlags: 0, highSuspicionFlags: 0, recentFlags: 0, flagRate: 0 };
    }
  }
}

// Singleton instance
let fairplayDetectorInstance: FairplayDetector | null = null;

export function getFairplayDetector(): FairplayDetector {
  if (!fairplayDetectorInstance) {
    fairplayDetectorInstance = new FairplayDetector();
  }
  return fairplayDetectorInstance;
}