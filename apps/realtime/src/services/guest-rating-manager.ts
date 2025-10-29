import { updateGlicko2, type GameResult } from '@chess960/rating';
import type { TimeControl } from '@chess960/proto';
import { guestPersistenceService, type GuestSessionData, type GuestRating, type GuestStats, type GuestGame } from './guest-persistence';

// Interfaces are now imported from guest-persistence.ts

export class GuestRatingManager {
  private guestRatings = new Map<string, Map<string, GuestRating>>();
  private guestStats = new Map<string, GuestStats>();
  private guestGames = new Map<string, GuestGame[]>(); // Store game history for session
  private loadedSessions = new Set<string>(); // Track which sessions have been loaded from Redis

  // Load guest session from Redis if not already loaded
  private async ensureSessionLoaded(userId: string): Promise<void> {
    if (this.loadedSessions.has(userId)) {
      return;
    }

    try {
      const sessionData = await guestPersistenceService.loadGuestSession(userId);
      if (sessionData) {
        // Load data into memory
        const ratingsMap = new Map<string, GuestRating>();
        Object.entries(sessionData.ratings).forEach(([tc, rating]) => {
          ratingsMap.set(tc, rating);
        });
        this.guestRatings.set(userId, ratingsMap);
        this.guestStats.set(userId, sessionData.stats);
        this.guestGames.set(userId, sessionData.games);
        
        console.log(`[GUEST-RATING-MANAGER] Loaded session from Redis for ${userId}`);
      } else {
        // Create new session
        this.guestRatings.set(userId, new Map());
        this.guestStats.set(userId, {
          gamesPlayed: 0,
          gamesWon: 0,
          gamesLost: 0,
          gamesDrawn: 0,
        });
        this.guestGames.set(userId, []);
        
        // Save new session to Redis
        await this.saveSessionToRedis(userId, `Guest${userId.slice(-6)}`);
        
        console.log(`[GUEST-RATING-MANAGER] Created new session for ${userId}`);
      }
      
      this.loadedSessions.add(userId);
    } catch (error) {
      console.error(`[GUEST-RATING-MANAGER] Error loading session for ${userId}:`, error);
      // Fallback to in-memory only
      this.guestRatings.set(userId, new Map());
      this.guestStats.set(userId, {
        gamesPlayed: 0,
        gamesWon: 0,
        gamesLost: 0,
        gamesDrawn: 0,
      });
      this.guestGames.set(userId, []);
      this.loadedSessions.add(userId);
    }
  }

  // Save session to Redis
  private async saveSessionToRedis(userId: string, handle: string): Promise<void> {
    try {
      const sessionData: GuestSessionData = {
        userId,
        handle,
        ratings: Object.fromEntries(this.guestRatings.get(userId) || new Map()),
        stats: this.guestStats.get(userId) || {
          gamesPlayed: 0,
          gamesWon: 0,
          gamesLost: 0,
          gamesDrawn: 0,
        },
        games: this.guestGames.get(userId) || [],
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
      };

      await guestPersistenceService.saveGuestSession(sessionData);
    } catch (error) {
      console.error(`[GUEST-RATING-MANAGER] Error saving session for ${userId}:`, error);
    }
  }

  // Get or create rating for guest user
  async getGuestRating(userId: string, tc: TimeControl): Promise<GuestRating> {
    await this.ensureSessionLoaded(userId);
    
    const userRatings = this.guestRatings.get(userId)!;
    if (!userRatings.has(tc)) {
      userRatings.set(tc, { rating: 1500, rd: 350, vol: 0.06 });
    }
    
    return userRatings.get(tc)!;
  }

  // Update guest rating after game
  async updateGuestRating(userId: string, tc: TimeControl, opponentRating: GuestRating, result: GameResult): Promise<GuestRating> {
    await this.ensureSessionLoaded(userId);
    
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

    // Save to Redis
    await this.saveSessionToRedis(userId, `Guest${userId.slice(-6)}`);

    return updatedRating;
  }

  // Get guest stats
  async getGuestStats(userId: string): Promise<GuestStats> {
    await this.ensureSessionLoaded(userId);
    
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
  async updateGuestStats(userId: string, result: GameResult): Promise<void> {
    await this.ensureSessionLoaded(userId);
    
    const stats = this.getGuestStats(userId);
    stats.gamesPlayed++;
    
    if (result === 1) {
      stats.gamesWon++;
    } else if (result === 0) {
      stats.gamesLost++;
    } else {
      stats.gamesDrawn++;
    }

    // Save to Redis
    await this.saveSessionToRedis(userId, `Guest${userId.slice(-6)}`);
  }

  // Add game to guest history
  async addGuestGame(userId: string, game: GuestGame): Promise<void> {
    await this.ensureSessionLoaded(userId);
    
    if (!this.guestGames.has(userId)) {
      this.guestGames.set(userId, []);
    }
    
    const userGames = this.guestGames.get(userId)!;
    userGames.unshift(game); // Add to beginning
    
    // Keep only last 20 games
    if (userGames.length > 20) {
      userGames.splice(20);
    }

    // Save to Redis
    await this.saveSessionToRedis(userId, `Guest${userId.slice(-6)}`);
  }

  // Get guest game history
  async getGuestGameHistory(userId: string): Promise<GuestGame[]> {
    await this.ensureSessionLoaded(userId);
    return this.guestGames.get(userId) || [];
  }

  // Clean up guest data (call when session ends)
  async cleanupGuestData(userId: string): Promise<void> {
    // Save final state to Redis before cleanup
    await this.saveSessionToRedis(userId, `Guest${userId.slice(-6)}`);
    
    // Clean up memory
    this.guestRatings.delete(userId);
    this.guestStats.delete(userId);
    this.guestGames.delete(userId);
    this.loadedSessions.delete(userId);
  }

  // Get all guest data for a user
  async getGuestData(userId: string): Promise<{
    ratings: Map<string, GuestRating>;
    stats: GuestStats;
    games: GuestGame[];
  }> {
    await this.ensureSessionLoaded(userId);
    
    return {
      ratings: this.guestRatings.get(userId) || new Map(),
      stats: await this.getGuestStats(userId),
      games: await this.getGuestGameHistory(userId),
    };
  }

  // Force save current session to Redis
  async saveCurrentSession(userId: string, handle: string): Promise<void> {
    await this.saveSessionToRedis(userId, handle);
  }
}

// Singleton instance
export const guestRatingManager = new GuestRatingManager();
