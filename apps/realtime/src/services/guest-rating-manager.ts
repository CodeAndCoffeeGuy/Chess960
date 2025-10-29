import { updateGlicko2, type GameResult } from '@chess960/rating';
import type { TimeControl } from '@chess960/proto';

interface GuestRating {
  rating: number;
  rd: number;
  vol: number;
}

interface GuestStats {
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  gamesDrawn: number;
}

export class GuestRatingManager {
  private guestRatings = new Map<string, Map<string, GuestRating>>();
  private guestStats = new Map<string, GuestStats>();
  private guestGames = new Map<string, any[]>(); // Store game history for session

  // Get or create rating for guest user
  getGuestRating(userId: string, tc: TimeControl): GuestRating {
    if (!this.guestRatings.has(userId)) {
      this.guestRatings.set(userId, new Map());
    }
    
    const userRatings = this.guestRatings.get(userId)!;
    if (!userRatings.has(tc)) {
      userRatings.set(tc, { rating: 1500, rd: 350, vol: 0.06 });
    }
    
    return userRatings.get(tc)!;
  }

  // Update guest rating after game
  updateGuestRating(userId: string, tc: TimeControl, opponentRating: GuestRating, result: GameResult): GuestRating {
    const currentRating = this.getGuestRating(userId, tc);
    
    const newRating = updateGlicko2(
      {
        rating: currentRating.rating,
        rd: currentRating.rd,
        vol: currentRating.vol,
      },
      [
        {
          opponent: {
            rating: opponentRating.rating,
            rd: opponentRating.rd,
            vol: opponentRating.vol,
          },
          result: result,
        },
      ]
    );

    const updatedRating = {
      rating: Math.round(newRating.rating),
      rd: Math.round(newRating.rd),
      vol: newRating.vol,
    };

    const userRatings = this.guestRatings.get(userId)!;
    userRatings.set(tc, updatedRating);

    return updatedRating;
  }

  // Get guest stats
  getGuestStats(userId: string): GuestStats {
    if (!this.guestStats.has(userId)) {
      this.guestStats.set(userId, {
        gamesPlayed: 0,
        gamesWon: 0,
        gamesLost: 0,
        gamesDrawn: 0,
      });
    }
    return this.guestStats.get(userId)!;
  }

  // Update guest stats
  updateGuestStats(userId: string, result: GameResult): void {
    const stats = this.getGuestStats(userId);
    stats.gamesPlayed++;
    
    if (result === 1) {
      stats.gamesWon++;
    } else if (result === 0) {
      stats.gamesLost++;
    } else {
      stats.gamesDrawn++;
    }
  }

  // Add game to guest history
  addGuestGame(userId: string, game: any): void {
    if (!this.guestGames.has(userId)) {
      this.guestGames.set(userId, []);
    }
    
    const userGames = this.guestGames.get(userId)!;
    userGames.unshift(game); // Add to beginning
    
    // Keep only last 20 games
    if (userGames.length > 20) {
      userGames.splice(20);
    }
  }

  // Get guest game history
  getGuestGameHistory(userId: string): any[] {
    return this.guestGames.get(userId) || [];
  }

  // Clean up guest data (call when session ends)
  cleanupGuestData(userId: string): void {
    this.guestRatings.delete(userId);
    this.guestStats.delete(userId);
    this.guestGames.delete(userId);
  }

  // Get all guest data for a user
  getGuestData(userId: string): {
    ratings: Map<string, GuestRating>;
    stats: GuestStats;
    games: any[];
  } {
    return {
      ratings: this.guestRatings.get(userId) || new Map(),
      stats: this.getGuestStats(userId),
      games: this.getGuestGameHistory(userId),
    };
  }
}

// Singleton instance
export const guestRatingManager = new GuestRatingManager();
