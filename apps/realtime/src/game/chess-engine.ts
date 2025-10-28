import { Chess } from 'chess.js';

export class ChessEngine {
  private chess: Chess;

  constructor(fen?: string) {
    this.chess = new Chess(fen);
  }

  // Validate and make a move
  makeMove(uci: string): boolean {
    try {
      const move = this.chess.move({
        from: uci.slice(0, 2),
        to: uci.slice(2, 4),
        promotion: uci.length === 5 ? uci[4] : undefined,
      });
      return move !== null;
    } catch {
      return false;
    }
  }

  // Get current FEN
  getFen(): string {
    return this.chess.fen();
  }

  // Get current turn
  getTurn(): 'white' | 'black' {
    return this.chess.turn() === 'w' ? 'white' : 'black';
  }

  // Check if game is over
  isGameOver(): boolean {
    return this.chess.isGameOver();
  }

  // Get game result
  getResult(): { result: string; reason: string } | null {
    if (!this.chess.isGameOver()) {
      return null;
    }

    if (this.chess.isCheckmate()) {
      const winner = this.chess.turn() === 'w' ? 'black' : 'white';
      return {
        result: winner === 'white' ? '1-0' : '0-1',
        reason: 'checkmate',
      };
    }

    if (this.chess.isStalemate()) {
      return {
        result: '1/2-1/2',
        reason: 'stalemate',
      };
    }

    if (this.chess.isThreefoldRepetition()) {
      return {
        result: '1/2-1/2',
        reason: 'threefold repetition',
      };
    }

    if (this.chess.isInsufficientMaterial()) {
      return {
        result: '1/2-1/2',
        reason: 'insufficient material',
      };
    }

    if (this.chess.isDraw()) {
      return {
        result: '1/2-1/2',
        reason: 'draw',
      };
    }

    return {
      result: '1/2-1/2',
      reason: 'unknown',
    };
  }

  // Check if move is legal without making it
  isValidMove(uci: string): boolean {
    try {
      const moves = this.chess.moves({ verbose: true });
      return moves.some(
        (move) =>
          move.from === uci.slice(0, 2) &&
          move.to === uci.slice(2, 4) &&
          (uci.length === 4 || move.promotion === uci[4])
      );
    } catch {
      return false;
    }
  }

  // Get all legal moves in UCI format
  getLegalMoves(): string[] {
    try {
      return this.chess.moves({ verbose: true }).map((move) => {
        const uci = move.from + move.to;
        return move.promotion ? uci + move.promotion : uci;
      });
    } catch {
      return [];
    }
  }

  // Check if position is check
  isInCheck(): boolean {
    return this.chess.inCheck();
  }

  // Get move history
  getHistory(): string[] {
    return this.chess.history();
  }

  // Get PGN
  getPgn(): string {
    return this.chess.pgn();
  }

  // Load game from moves array with optional initial FEN (for Chess960)
  static fromMoves(moves: string[], initialFen?: string): ChessEngine {
    const engine = new ChessEngine(initialFen);
    for (const move of moves) {
      if (!engine.makeMove(move)) {
        throw new Error(`Invalid move in sequence: ${move}`);
      }
    }
    return engine;
  }

  // Clone the engine
  clone(): ChessEngine {
    return new ChessEngine(this.getFen());
  }
}