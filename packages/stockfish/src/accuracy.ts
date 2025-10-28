/**
 * Accuracy calculation system
 * Based on Chess960 winning chances algorithm
 */

export interface WinningChances {
  white: number;
  black: number;
}

export interface AccuracyData {
  accuracy: number;
  classification: 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder' | 'missed-win';
  winPercent: number;
  winPercentLoss: number;
}

export interface MoveClassification {
  type: 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder' | 'missed-win';
  symbol: string;
  color: string;
  threshold: number;
}

// Chess960 winning chances multiplier
const MULTIPLIER = -0.00368208;

/**
 * Convert centipawn evaluation to winning chances
 * Based on Chess960 algorithm
 */
function rawWinningChances(cp: number): number {
  return 2 / (1 + Math.exp(MULTIPLIER * cp)) - 1;
}

/**
 * Calculate winning chances from centipawn evaluation (clamped)
 */
export function cpWinningChances(cp: number): number {
  return rawWinningChances(Math.min(Math.max(-1000, cp), 1000));
}

/**
 * Calculate winning chances from mate score
 */
export function mateWinningChances(mate: number): number {
  const cp = (21 - Math.min(10, Math.abs(mate))) * 100;
  const signed = cp * (mate > 0 ? 1 : -1);
  return rawWinningChances(signed);
}

/**
 * Get winning chances from evaluation (handles both CP and mate)
 */
export function evalWinningChances(evaluation: { cp?: number; mate?: number }): number {
  if (typeof evaluation.mate !== 'undefined') {
    return mateWinningChances(evaluation.mate);
  }
  return cpWinningChances(evaluation.cp || 0);
}

/**
 * Get winning chances for a specific color (POV)
 */
export function povWinningChances(color: 'white' | 'black', evaluation: { cp?: number; mate?: number }): number {
  const chances = evalWinningChances(evaluation);
  return color === 'white' ? chances : -chances;
}

/**
 * Calculate the difference in winning chances between two evaluations
 */
export function povDiff(color: 'white' | 'black', eval1: { cp?: number; mate?: number }, eval2: { cp?: number; mate?: number }): number {
  const chances1 = povWinningChances(color, eval1);
  const chances2 = povWinningChances(color, eval2);
  return (chances1 - chances2) / 2;
}

/**
 * Convert winning chances to percentage (0-100%)
 */
export function winningChancesToPercent(chances: number): number {
  return Math.round((chances + 1) * 50);
}

/**
 * Calculate move accuracy using Chess960 algorithm
 * Returns accuracy percentage (0-100)
 */
export function calculateAccuracy(
  beforeEval: { cp?: number; mate?: number },
  afterEval: { cp?: number; mate?: number },
  color: 'white' | 'black'
): AccuracyData {
  const winChanceBefore = povWinningChances(color, beforeEval);
  const winChanceAfter = povWinningChances(color, afterEval);
  
  // Calculate win percentage loss (always positive)
  const winPercentLoss = Math.max(0, (winChanceBefore - winChanceAfter) * 50);
  
  // Accuracy formula
  const accuracy = Math.max(0, Math.min(100, 103.1668 * Math.exp(-0.04354 * winPercentLoss) - 3.1669));
  
  // Classify the move
  const classification = classifyMoveByAccuracy(accuracy, winPercentLoss);
  
  return {
    accuracy: Math.round(accuracy * 10) / 10,
    classification: classification.type,
    winPercent: winningChancesToPercent(winChanceAfter),
    winPercentLoss: Math.round(winPercentLoss * 10) / 10
  };
}

/**
 * Classify move by accuracy percentage and win% loss
 */
function classifyMoveByAccuracy(accuracy: number, winPercentLoss: number): MoveClassification {
  // Special case for major blunders (>= 20% win loss)
  if (winPercentLoss >= 20) {
    return { type: 'blunder', symbol: '??', color: '#e74c3c', threshold: 20 };
  }
  
  // Standard classification by accuracy
  if (accuracy >= 96) {
    return { type: 'excellent', symbol: '', color: '#27ae60', threshold: 96 };
  }
  if (accuracy >= 90) {
    return { type: 'good', symbol: '', color: '#3498db', threshold: 90 };
  }
  if (accuracy >= 80 || winPercentLoss < 5) {
    return { type: 'inaccuracy', symbol: '?!', color: '#f39c12', threshold: 80 };
  }
  if (accuracy >= 60 || winPercentLoss < 10) {
    return { type: 'mistake', symbol: '?', color: '#e67e22', threshold: 60 };
  }
  
  return { type: 'blunder', symbol: '??', color: '#e74c3c', threshold: 0 };
}

/**
 * Calculate overall accuracy for a series of moves
 */
export function calculateOverallAccuracy(accuracies: number[]): number {
  if (accuracies.length === 0) return 0;
  
  // Use geometric mean for accuracy calculation (like Chess960)
  const sum = accuracies.reduce((acc, curr) => acc + Math.log(Math.max(0.01, curr)), 0);
  const geometricMean = Math.exp(sum / accuracies.length);
  
  return Math.round(geometricMean * 10) / 10;
}

/**
 * Get move classification details
 */
export function getMoveClassification(type: string): MoveClassification {
  const classifications: Record<string, MoveClassification> = {
    'excellent': { type: 'excellent', symbol: '', color: '#27ae60', threshold: 96 },
    'good': { type: 'good', symbol: '', color: '#3498db', threshold: 90 },
    'inaccuracy': { type: 'inaccuracy', symbol: '?!', color: '#f39c12', threshold: 80 },
    'mistake': { type: 'mistake', symbol: '?', color: '#e67e22', threshold: 60 },
    'blunder': { type: 'blunder', symbol: '??', color: '#e74c3c', threshold: 0 },
    'missed-win': { type: 'missed-win', symbol: '?!', color: '#9b59b6', threshold: 0 }
  };
  
  return classifications[type] || classifications['good'];
}

/**
 * Detect if a position is a book position (simplified)
 */
export function isBookPosition(ply: number, evaluation: { cp?: number; mate?: number }): boolean {
  // Very basic book detection - positions in first 10 moves with small eval
  if (ply > 20) return false;
  
  const absEval = Math.abs(evaluation.cp || 0);
  return absEval < 50; // Less than 0.5 pawns
}