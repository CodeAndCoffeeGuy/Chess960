export interface AnalysisOptions {
  depth?: number;
  time?: number;
  multipv?: number;
}

export interface AnalysisMove {
  uci: string;
  san: string;
  evaluation: number;
  depth: number;
  pv: string[];
  mate?: number;
  isBook?: boolean;
}

export interface AnalysisResult {
  bestMove: AnalysisMove;
  alternativeMoves: AnalysisMove[];
  evaluation: number;
  depth: number;
  time: number;
  nodes: number;
}

export interface PositionAnalysis {
  fen: string;
  evaluation: number;
  bestMove: string;
  pv: string[];
  depth: number;
  mate?: number;
  isBookPosition?: boolean;
}

export interface GameAnalysis {
  moves: Array<{
    move: string;
    evaluation: number;
    bestMove: string;
    accuracy?: number;
    classification?: 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';
  }>;
  averageAccuracy: {
    white: number;
    black: number;
  };
  gameResult: string;
  openingName?: string;
}