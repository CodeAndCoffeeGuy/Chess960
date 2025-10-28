/**
 * Glicko-2 Rating System Implementation
 * Based on Mark Glickman's paper: "Example of the Glicko-2 system"
 */

export interface Rating {
  rating: number;
  rd: number;     // Rating Deviation
  vol: number;    // Volatility
}

export type GameResult = 1 | 0.5 | 0;

export interface GameOutcome {
  opponent: Rating;
  result: GameResult;
}

const TAU = 0.5; // System constraint for volatility
const SCALE = 173.7178; // Scale factor

/**
 * Convert rating to mu (scaled rating)
 */
function ratingToMu(rating: number): number {
  return (rating - 1500) / SCALE;
}

/**
 * Convert RD to phi (scaled RD)
 */
function rdToPhi(rd: number): number {
  return rd / SCALE;
}

/**
 * Convert mu back to rating
 */
function muToRating(mu: number): number {
  return mu * SCALE + 1500;
}

/**
 * Convert phi back to RD
 */
function phiToRd(phi: number): number {
  return phi * SCALE;
}

/**
 * g function - measures uncertainty in opponent's rating
 */
function g(phi: number): number {
  return 1 / Math.sqrt(1 + (3 * phi * phi) / (Math.PI * Math.PI));
}

/**
 * Expected outcome function
 */
function E(mu: number, muOpponent: number, phiOpponent: number): number {
  return 1 / (1 + Math.exp(-g(phiOpponent) * (mu - muOpponent)));
}

/**
 * Newton-Raphson method to find new volatility
 */
function findNewVolatility(
  vol: number,
  delta: number,
  phi: number,
  v: number
): number {
  const epsilon = 0.000001;
  const a = Math.log(vol * vol);
  
  let A = a;
  let B: number;
  
  if (delta * delta > phi * phi + v) {
    B = Math.log(delta * delta - phi * phi - v);
  } else {
    let k = 1;
    while (f(a - k * TAU, delta, phi, v, a) < 0) {
      k++;
    }
    B = a - k * TAU;
  }
  
  let fA = f(A, delta, phi, v, a);
  let fB = f(B, delta, phi, v, a);
  
  while (Math.abs(B - A) > epsilon) {
    const C = A + (A - B) * fA / (fB - fA);
    const fC = f(C, delta, phi, v, a);
    
    if (fC * fB <= 0) {
      A = B;
      fA = fB;
    } else {
      fA = fA / 2;
    }
    
    B = C;
    fB = fC;
  }
  
  return Math.exp(A / 2);
}

/**
 * Helper function for Newton-Raphson method
 */
function f(x: number, delta: number, phi: number, v: number, a: number): number {
  const ex = Math.exp(x);
  const phi2 = phi * phi;
  const delta2 = delta * delta;
  const v2 = v * v;
  
  const numerator = ex * (delta2 - phi2 - v - ex);
  const denominator = 2 * (phi2 + v + ex) * (phi2 + v + ex);
  
  return numerator / denominator - (x - a) / (TAU * TAU);
}

/**
 * Update a player's rating based on game outcomes
 */
export function updateGlicko2(
  player: Rating,
  gameOutcomes: GameOutcome[]
): Rating {
  if (gameOutcomes.length === 0) {
    // No games played - apply RD inflation due to inactivity
    const newRd = Math.min(Math.sqrt(player.rd * player.rd + player.vol * player.vol), 350);
    return {
      ...player,
      rd: newRd
    };
  }
  
  // Step 2: Convert to Glicko-2 scale
  const mu = ratingToMu(player.rating);
  const phi = rdToPhi(player.rd);
  
  // Step 3: Compute v (estimated variance)
  let vInverse = 0;
  for (const game of gameOutcomes) {
    const muJ = ratingToMu(game.opponent.rating);
    const phiJ = rdToPhi(game.opponent.rd);
    const gJ = g(phiJ);
    const eJ = E(mu, muJ, phiJ);
    
    vInverse += gJ * gJ * eJ * (1 - eJ);
  }
  const v = 1 / vInverse;
  
  // Step 4: Compute delta (improvement in rating)
  let deltaSum = 0;
  for (const game of gameOutcomes) {
    const muJ = ratingToMu(game.opponent.rating);
    const phiJ = rdToPhi(game.opponent.rd);
    const gJ = g(phiJ);
    const eJ = E(mu, muJ, phiJ);
    
    deltaSum += gJ * (game.result - eJ);
  }
  const delta = v * deltaSum;
  
  // Step 5: Determine new volatility
  const newVol = findNewVolatility(player.vol, delta, phi, v);
  
  // Step 6: Update rating deviation to pre-period value
  const phiStar = Math.sqrt(phi * phi + newVol * newVol);
  
  // Step 7: Update rating and RD to post-period values
  const newPhi = 1 / Math.sqrt(1 / (phiStar * phiStar) + 1 / v);
  const newMu = mu + newPhi * newPhi * deltaSum;
  
  // Step 8: Convert back to original scale
  return {
    rating: Math.round(muToRating(newMu)),
    rd: Math.round(phiToRd(newPhi) * 100) / 100,
    vol: Math.round(newVol * 10000) / 10000
  };
}

/**
 * Create a new rating for a beginner player
 */
export function createNewRating(): Rating {
  return {
    rating: 1500,
    rd: 350,
    vol: 0.06
  };
}

/**
 * Calculate expected score between two players
 */
export function expectedScore(player: Rating, opponent: Rating): number {
  const mu = ratingToMu(player.rating);
  const muOpp = ratingToMu(opponent.rating);
  const phiOpp = rdToPhi(opponent.rd);
  
  return E(mu, muOpp, phiOpp);
}

/**
 * Apply rating floor (minimum rating)
 */
export function applyRatingFloor(rating: Rating, floor = 100): Rating {
  return {
    ...rating,
    rating: Math.max(rating.rating, floor)
  };
}