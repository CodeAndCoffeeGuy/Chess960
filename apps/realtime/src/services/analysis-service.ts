import { GameAnalyzer, StockfishEngine } from '@chess960/stockfish';
import { ChessEngine } from '../game/chess-engine';
import { EventEmitter } from 'events';

export interface AnalysisRequest {
  id: string;
  type: 'position' | 'game';
  data: {
    fen?: string;
    pgn?: string;
    moves?: string[];
    depth?: number;
  };
  userId: string;
}

export interface AnalysisResponse {
  id: string;
  type: 'position' | 'game';
  result: any; // PositionAnalysis | GameAnalysis;
  error?: string;
}

export class AnalysisService extends EventEmitter {
  private analyzer: GameAnalyzer;
  private engine: StockfishEngine;
  private activeAnalyses = new Map<string, Promise<any>>();
  private maxConcurrentAnalyses = 3;

  constructor() {
    super();
    this.analyzer = new GameAnalyzer();
    this.engine = new StockfishEngine();
  }

  async analyzePosition(request: AnalysisRequest): Promise<AnalysisResponse> {
    if (this.activeAnalyses.size >= this.maxConcurrentAnalyses) {
      return {
        id: request.id,
        type: 'position',
        result: {} as any, // PositionAnalysis,
        error: 'Analysis queue full. Please try again later.'
      };
    }

    const { fen, depth = 15 } = request.data;
    
    if (!fen) {
      return {
        id: request.id,
        type: 'position',
        result: {} as any, // PositionAnalysis,
        error: 'FEN position is required'
      };
    }

    try {
      const analysisPromise = this.engine.getPositionEvaluation(fen, depth);
      this.activeAnalyses.set(request.id, analysisPromise);

      const result = await analysisPromise;
      
      this.activeAnalyses.delete(request.id);
      
      return {
        id: request.id,
        type: 'position',
        result
      };
    } catch (error) {
      this.activeAnalyses.delete(request.id);
      return {
        id: request.id,
        type: 'position',
        result: {} as any, // PositionAnalysis,
        error: error instanceof Error ? error.message : 'Analysis failed'
      };
    }
  }

  async analyzeGame(request: AnalysisRequest): Promise<AnalysisResponse> {
    if (this.activeAnalyses.size >= this.maxConcurrentAnalyses) {
      return {
        id: request.id,
        type: 'game',
        result: {} as any, // GameAnalysis,
        error: 'Analysis queue full. Please try again later.'
      };
    }

    const { pgn, moves, depth = 12 } = request.data;
    
    if (!pgn && !moves) {
      return {
        id: request.id,
        type: 'game',
        result: {} as any, // GameAnalysis,
        error: 'PGN or moves array is required'
      };
    }

    try {
      let pgnToAnalyze = pgn;
      
      // If moves array provided, convert to PGN
      if (moves && !pgn) {
        pgnToAnalyze = this.movesToPgn(moves);
      }

      if (!pgnToAnalyze) {
        throw new Error('Could not generate PGN from moves');
      }

      const analysisPromise = this.analyzer.analyzeGame(pgnToAnalyze, depth);
      this.activeAnalyses.set(request.id, analysisPromise);

      const result = await analysisPromise;
      
      this.activeAnalyses.delete(request.id);
      
      return {
        id: request.id,
        type: 'game',
        result
      };
    } catch (error) {
      this.activeAnalyses.delete(request.id);
      return {
        id: request.id,
        type: 'game',
        result: {} as any, // GameAnalysis,
        error: error instanceof Error ? error.message : 'Analysis failed'
      };
    }
  }

  async getBestMove(fen: string, timeMs: number = 3000): Promise<string> {
    try {
      return await this.engine.findBestMove(fen, timeMs);
    } catch (error) {
      console.error('Best move analysis failed:', error);
      return '';
    }
  }

  private movesToPgn(moves: string[]): string {
    try {
      const engine = new ChessEngine();
      const pgnMoves: string[] = [];
      
      for (let i = 0; i < moves.length; i++) {
        const move = moves[i];
        
        // Store current position to get SAN notation
        const _beforeMoveHistory = engine.getHistory();
        
        if (!engine.makeMove(move)) {
          throw new Error(`Invalid move: ${move}`);
        }
        
        const afterMoveHistory = engine.getHistory();
        const sanMove = afterMoveHistory[afterMoveHistory.length - 1];
        
        if (i % 2 === 0) {
          // White move
          pgnMoves.push(`${Math.floor(i / 2) + 1}. ${sanMove}`);
        } else {
          // Black move
          pgnMoves[pgnMoves.length - 1] += ` ${sanMove}`;
        }
      }
      
      return pgnMoves.join(' ');
    } catch (error) {
      console.error('Failed to convert moves to PGN:', error);
      return '';
    }
  }

  async cancelAnalysis(analysisId: string): Promise<boolean> {
    if (this.activeAnalyses.has(analysisId)) {
      this.activeAnalyses.delete(analysisId);
      return true;
    }
    return false;
  }

  getQueueStatus(): { active: number; max: number } {
    return {
      active: this.activeAnalyses.size,
      max: this.maxConcurrentAnalyses
    };
  }

  async isEngineReady(): Promise<boolean> {
    // return await this.engine.isReady();
    return false; // Engine temporarily disabled
  }

  async destroy(): Promise<void> {
    // await this.analyzer.destroy();
    // this.engine.destroy();
    this.activeAnalyses.clear();
    this.removeAllListeners();
  }
}