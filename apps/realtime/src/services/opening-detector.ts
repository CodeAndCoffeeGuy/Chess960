/**
 * Chess Opening Detection Service
 * Detects chess openings based on move sequences
 */

interface Opening {
  name: string;
  eco: string; // Encyclopedia of Chess Openings code
  moves: string; // UCI moves
  ply: number; // Number of half-moves
}

// Popular chess openings database (ECO codes)
const OPENINGS: Opening[] = [
  // King's Pawn Openings (e4)
  { eco: 'B00', name: "King's Pawn Opening", moves: 'e2e4', ply: 1 },

  // Sicilian Defense
  { eco: 'B20', name: 'Sicilian Defense', moves: 'e2e4 c7c5', ply: 2 },
  { eco: 'B23', name: 'Sicilian Defense: Closed', moves: 'e2e4 c7c5 b1c3', ply: 3 },
  { eco: 'B50', name: 'Sicilian Defense: Modern Variations', moves: 'e2e4 c7c5 g1f3 d7d6', ply: 4 },
  { eco: 'B90', name: 'Sicilian Defense: Najdorf', moves: 'e2e4 c7c5 g1f3 d7d6 d2d4 c5d4 f3d4 g8f6 b1c3 a7a6', ply: 10 },
  { eco: 'B70', name: 'Sicilian Defense: Dragon', moves: 'e2e4 c7c5 g1f3 d7d6 d2d4 c5d4 f3d4 g8f6 b1c3 g7g6', ply: 10 },

  // French Defense
  { eco: 'C00', name: 'French Defense', moves: 'e2e4 e7e6', ply: 2 },
  { eco: 'C10', name: 'French Defense: Rubinstein', moves: 'e2e4 e7e6 d2d4 d7d5 b1c3 d5e4', ply: 6 },
  { eco: 'C11', name: 'French Defense: Classical', moves: 'e2e4 e7e6 d2d4 d7d5 b1c3 g8f6', ply: 6 },

  // Caro-Kann Defense
  { eco: 'B10', name: 'Caro-Kann Defense', moves: 'e2e4 c7c6', ply: 2 },
  { eco: 'B12', name: 'Caro-Kann Defense: Advance', moves: 'e2e4 c7c6 d2d4 d7d5 e4e5', ply: 5 },

  // Scandinavian Defense
  { eco: 'B01', name: 'Scandinavian Defense', moves: 'e2e4 d7d5', ply: 2 },

  // Pirc Defense
  { eco: 'B07', name: 'Pirc Defense', moves: 'e2e4 d7d6 d2d4 g8f6 b1c3 g7g6', ply: 6 },

  // Italian Game
  { eco: 'C50', name: 'Italian Game', moves: 'e2e4 e7e5 g1f3 b8c6 f1c4', ply: 5 },
  { eco: 'C53', name: 'Italian Game: Giuoco Piano', moves: 'e2e4 e7e5 g1f3 b8c6 f1c4 f8c5', ply: 6 },
  { eco: 'C55', name: 'Italian Game: Two Knights Defense', moves: 'e2e4 e7e5 g1f3 b8c6 f1c4 g8f6', ply: 6 },

  // Spanish/Ruy Lopez
  { eco: 'C60', name: 'Ruy Lopez', moves: 'e2e4 e7e5 g1f3 b8c6 f1b5', ply: 5 },
  { eco: 'C65', name: 'Ruy Lopez: Berlin Defense', moves: 'e2e4 e7e5 g1f3 b8c6 f1b5 g8f6', ply: 6 },
  { eco: 'C84', name: 'Ruy Lopez: Closed', moves: 'e2e4 e7e5 g1f3 b8c6 f1b5 a7a6 b5a4 g8f6 e1g1 f8e7', ply: 10 },

  // Scotch Game
  { eco: 'C45', name: 'Scotch Game', moves: 'e2e4 e7e5 g1f3 b8c6 d2d4', ply: 5 },

  // Four Knights
  { eco: 'C47', name: 'Four Knights Game', moves: 'e2e4 e7e5 g1f3 b8c6 b1c3 g8f6', ply: 6 },

  // Petrov's Defense
  { eco: 'C42', name: "Petrov's Defense", moves: 'e2e4 e7e5 g1f3 g8f6', ply: 4 },

  // Philidor Defense
  { eco: 'C41', name: 'Philidor Defense', moves: 'e2e4 e7e5 g1f3 d7d6', ply: 4 },

  // Vienna Game
  { eco: 'C25', name: 'Vienna Game', moves: 'e2e4 e7e5 b1c3', ply: 3 },

  // King's Gambit
  { eco: 'C30', name: "King's Gambit", moves: 'e2e4 e7e5 f2f4', ply: 3 },
  { eco: 'C33', name: "King's Gambit Accepted", moves: 'e2e4 e7e5 f2f4 e5f4', ply: 4 },

  // Queen's Pawn Openings (d4)
  { eco: 'D00', name: "Queen's Pawn Opening", moves: 'd2d4', ply: 1 },

  // Queen's Gambit
  { eco: 'D06', name: "Queen's Gambit", moves: 'd2d4 d7d5 c2c4', ply: 3 },
  { eco: 'D30', name: "Queen's Gambit Declined", moves: 'd2d4 d7d5 c2c4 e7e6', ply: 4 },
  { eco: 'D31', name: "Queen's Gambit Declined: Semi-Slav", moves: 'd2d4 d7d5 c2c4 e7e6 b1c3 c7c6', ply: 6 },
  { eco: 'D35', name: "Queen's Gambit Declined: Exchange", moves: 'd2d4 d7d5 c2c4 e7e6 b1c3 g8f6 c4d5', ply: 7 },
  { eco: 'D20', name: "Queen's Gambit Accepted", moves: 'd2d4 d7d5 c2c4 d5c4', ply: 4 },

  // Slav Defense
  { eco: 'D10', name: 'Slav Defense', moves: 'd2d4 d7d5 c2c4 c7c6', ply: 4 },

  // King's Indian Defense
  { eco: 'E60', name: "King's Indian Defense", moves: 'd2d4 g8f6 c2c4 g7g6', ply: 4 },
  { eco: 'E70', name: "King's Indian Defense: Classical", moves: 'd2d4 g8f6 c2c4 g7g6 b1c3 f8g7 e2e4 d7d6', ply: 8 },

  // Nimzo-Indian Defense
  { eco: 'E20', name: 'Nimzo-Indian Defense', moves: 'd2d4 g8f6 c2c4 e7e6 b1c3 f8b4', ply: 6 },

  // Grünfeld Defense
  { eco: 'D70', name: 'Grünfeld Defense', moves: 'd2d4 g8f6 c2c4 g7g6 b1c3 d7d5', ply: 6 },

  // Dutch Defense
  { eco: 'A80', name: 'Dutch Defense', moves: 'd2d4 f7f5', ply: 2 },

  // Benoni Defense
  { eco: 'A56', name: 'Benoni Defense', moves: 'd2d4 g8f6 c2c4 c7c5', ply: 4 },

  // London System
  { eco: 'D02', name: 'London System', moves: 'd2d4 d7d5 g1f3 g8f6 c1f4', ply: 5 },
  { eco: 'A46', name: 'London System', moves: 'd2d4 g8f6 g1f3 e7e6 c1f4', ply: 5 },

  // Catalan Opening
  { eco: 'E00', name: 'Catalan Opening', moves: 'd2d4 g8f6 c2c4 e7e6 g2g3', ply: 5 },

  // English Opening (c4)
  { eco: 'A10', name: 'English Opening', moves: 'c2c4', ply: 1 },
  { eco: 'A20', name: 'English Opening: Symmetrical', moves: 'c2c4 e7e5', ply: 2 },
  { eco: 'A30', name: 'English Opening: Symmetrical', moves: 'c2c4 c7c5', ply: 2 },

  // Réti Opening
  { eco: 'A04', name: 'Réti Opening', moves: 'g1f3 d7d5 c2c4', ply: 3 },
  { eco: 'A05', name: 'Réti Opening', moves: 'g1f3 g8f6', ply: 2 },

  // Bird's Opening
  { eco: 'A02', name: "Bird's Opening", moves: 'f2f4', ply: 1 },
];

// Sort by ply (longest first) so we match the most specific opening
OPENINGS.sort((a, b) => b.ply - a.ply);

export class OpeningDetector {
  /**
   * Detect the opening based on a sequence of UCI moves
   * @param uciMoves Array of UCI move strings (e.g., ['e2e4', 'e7e5', ...])
   * @returns Opening info or null if no match
   */
  public detectOpening(uciMoves: string[]): { name: string; eco: string } | null {
    if (uciMoves.length === 0) {
      return null;
    }

    // Join moves into a single string for comparison
    const moveSequence = uciMoves.join(' ');

    // Find the longest matching opening
    for (const opening of OPENINGS) {
      if (moveSequence.startsWith(opening.moves) && uciMoves.length >= opening.ply) {
        return {
          name: opening.name,
          eco: opening.eco,
        };
      }
    }

    // Return a generic opening based on first move if no specific opening matched
    if (uciMoves.length > 0) {
      const firstMove = uciMoves[0];
      if (firstMove === 'e2e4') return { name: "King's Pawn Opening", eco: 'B00' };
      if (firstMove === 'd2d4') return { name: "Queen's Pawn Opening", eco: 'D00' };
      if (firstMove === 'c2c4') return { name: 'English Opening', eco: 'A10' };
      if (firstMove === 'g1f3') return { name: "Zukertort Opening", eco: 'A04' };
      if (firstMove === 'f2f4') return { name: "Bird's Opening", eco: 'A02' };
    }

    return null;
  }

  /**
   * Get opening variation name (more detailed than main opening)
   * Returns null if moves are too short to determine variation
   */
  public getOpeningVariation(uciMoves: string[]): string | null {
    const opening = this.detectOpening(uciMoves);

    if (!opening || uciMoves.length < 4) {
      return null;
    }

    return opening.name;
  }
}

// Singleton instance
let instance: OpeningDetector | null = null;

export function getOpeningDetector(): OpeningDetector {
  if (!instance) {
    instance = new OpeningDetector();
  }
  return instance;
}
