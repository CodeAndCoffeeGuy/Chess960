// Server-side (Node.js) exports
export { StockfishEngine } from './stockfish-engine';
export { GameAnalyzer } from './game-analyzer';
export { PostGameAnalyzer } from './post-game-analysis';

// Browser-side (WebAssembly) exports
export { StockfishBrowser } from './stockfish-browser';
export { PostGameBrowserAnalyzer } from './post-game-browser';
export type { PostGameAnalysis, PostGameMove, AnalysisProgress } from './post-game-browser';

// Shared exports
export * from './types';
export * from './accuracy';