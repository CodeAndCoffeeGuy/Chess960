import { prisma } from '@chess960/db';
import { RedisClient } from '@chess960/redis-client';
import { TeamTournamentManager } from './team-tournament-manager';

interface QueuedPlayer {
  userId: string;
  teamId: string;
  entryId: string;
  rating: number;
  joinedAt: number;
}

export class TeamTournamentPairingService {
  private redis: RedisClient;
  private tournamentManager: TeamTournamentManager;
  private pairingIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.redis = RedisClient.getInstance();
    this.tournamentManager = new TeamTournamentManager();
  }

  /**
   * Get the Redis key for a tournament's waiting queue
   */
  private getQueueKey(tournamentId: string): string {
    return `team-tournament:${tournamentId}:queue`;
  }

  /**
   * Get the Redis key for tracking a user's queue status
   */
  private getUserQueueKey(tournamentId: string, userId: string): string {
    return `team-tournament:${tournamentId}:user:${userId}:queue-status`;
  }

  /**
   * Join the waiting queue for a team tournament
   */
  async joinQueue(tournamentId: string, userId: string): Promise<void> {
    // Verify tournament is live
    const tournament = await prisma.teamTournament.findUnique({
      where: { id: tournamentId },
      include: {
        teamEntries: {
          include: {
            players: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!tournament) {
      throw new Error('Team tournament not found');
    }

    if (tournament.status !== 'LIVE') {
      throw new Error('Tournament is not currently active');
    }

    // Find which team the user belongs to
    let userTeamId: string | null = null;
    let userEntryId: string | null = null;
    let userRating = 1500;

    for (const entry of tournament.teamEntries) {
      const player = entry.players.find((p: any) => p.userId === userId);
      if (player) {
        userTeamId = entry.teamId;
        userEntryId = entry.id;
        userRating = player.rating;
        break;
      }
    }

    if (!userTeamId || !userEntryId) {
      throw new Error('You are not registered in this tournament');
    }

    // Check if user is already in queue
    const existingStatus = await this.redis.get(this.getUserQueueKey(tournamentId, userId));
    if (existingStatus === 'queued') {
      throw new Error('Already in queue');
    }

    // Add to queue
    const queuedPlayer: QueuedPlayer = {
      userId,
      teamId: userTeamId,
      entryId: userEntryId,
      rating: userRating,
      joinedAt: Date.now(),
    };

    await this.redis.zadd(
      this.getQueueKey(tournamentId),
      Date.now(),
      JSON.stringify(queuedPlayer)
    );

    // Mark user as queued
    await this.redis.set(
      this.getUserQueueKey(tournamentId, userId),
      'queued',
      3600 // Expire after 1 hour (TTL in seconds)
    );

    // Publish queue update
    await this.redis.publish('tournament:team:queue:join', {
      tournamentId,
      userId,
      timestamp: new Date().toISOString(),
    });

    // Trigger pairing attempt
    await this.attemptPairing(tournamentId);

    console.log(`User ${userId} joined team tournament ${tournamentId} queue`);
  }

  /**
   * Leave the waiting queue
   */
  async leaveQueue(tournamentId: string, userId: string): Promise<void> {
    // Remove from queue
    const queueKey = this.getQueueKey(tournamentId);
    const members = await this.redis.zrange(queueKey, 0, -1);

    for (const member of members) {
      const player: QueuedPlayer = JSON.parse(member);
      if (player.userId === userId) {
        await this.redis.zrem(queueKey, member);
        break;
      }
    }

    // Remove queue status
    await this.redis.del(this.getUserQueueKey(tournamentId, userId));

    // Publish queue update
    await this.redis.publish('tournament:team:queue:leave', {
      tournamentId,
      userId,
      timestamp: new Date().toISOString(),
    });

    console.log(`User ${userId} left team tournament ${tournamentId} queue`);
  }

  /**
   * Get the current queue for a tournament
   */
  async getQueue(tournamentId: string): Promise<QueuedPlayer[]> {
    const queueKey = this.getQueueKey(tournamentId);
    const members = await this.redis.zrange(queueKey, 0, -1);

    return members.map((member: string) => JSON.parse(member) as QueuedPlayer);
  }

  /**
   * Get queue size
   */
  async getQueueSize(tournamentId: string): Promise<number> {
    const queueKey = this.getQueueKey(tournamentId);
    return await this.redis.zcard(queueKey);
  }

  /**
   * Attempt to pair players from the queue
   * CRITICAL: Prevents same-team pairing
   */
  async attemptPairing(tournamentId: string): Promise<void> {
    const queue = await this.getQueue(tournamentId);

    if (queue.length < 2) {
      return; // Not enough players to pair
    }

    // Sort by join time (FIFO)
    queue.sort((a, b) => a.joinedAt - b.joinedAt);

    const paired: Set<string> = new Set();

    for (let i = 0; i < queue.length; i++) {
      if (paired.has(queue[i].userId)) continue;

      const player1 = queue[i];

      // Find first opponent from a different team
      for (let j = i + 1; j < queue.length; j++) {
        if (paired.has(queue[j].userId)) continue;

        const player2 = queue[j];

        // CRITICAL: Check if they're on the same team
        if (player1.teamId === player2.teamId) {
          continue; // Skip same-team pairing
        }

        // Verify they're not on the same team (double-check with DB)
        const sameTeam = await this.tournamentManager.arePlayersOnSameTeam(
          tournamentId,
          player1.userId,
          player2.userId
        );

        if (sameTeam) {
          console.warn(`Prevented same-team pairing: ${player1.userId} and ${player2.userId}`);
          continue;
        }

        // Create pairing
        try {
          await this.createPairing(tournamentId, player1, player2);
          paired.add(player1.userId);
          paired.add(player2.userId);
          break;
        } catch (error) {
          console.error('Failed to create pairing:', error);
        }
      }
    }

    // Remove paired players from queue
    for (const userId of paired) {
      await this.leaveQueue(tournamentId, userId);
    }
  }

  /**
   * Create a game pairing between two players
   */
  private async createPairing(
    tournamentId: string,
    player1: QueuedPlayer,
    player2: QueuedPlayer
  ): Promise<void> {
    // Randomly assign colors
    const whitePlayer = Math.random() < 0.5 ? player1 : player2;
    const blackPlayer = whitePlayer === player1 ? player2 : player1;

    // Get tournament details for game settings
    const tournament = await prisma.teamTournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    // Create game
    const game = await prisma.game.create({
      data: {
        whiteId: whitePlayer.userId,
        blackId: blackPlayer.userId,
        tc: tournament.tc,
        rated: false, // Team tournament games are not rated
        variant: tournament.variant,
        chess960Position: tournament.chess960Position,
        whiteTimeMs: this.getTimeMs(tournament.tc),
        blackTimeMs: this.getTimeMs(tournament.tc),
        whiteIncMs: this.getIncrementMs(tournament.tc),
        blackIncMs: this.getIncrementMs(tournament.tc),
      },
    });

    // Publish pairing event
    await this.redis.publish('tournament:team:pairing:created', {
      tournamentId,
      gameId: game.id,
      whiteId: whitePlayer.userId,
      blackId: blackPlayer.userId,
      whiteTeamId: whitePlayer.teamId,
      blackTeamId: blackPlayer.teamId,
      timestamp: new Date().toISOString(),
    });

    console.log(
      `Created pairing in team tournament ${tournamentId}: ${whitePlayer.userId} (Team ${whitePlayer.teamId}) vs ${blackPlayer.userId} (Team ${blackPlayer.teamId})`
    );
  }

  /**
   * Helper to get time in milliseconds from TimeControl enum
   */
  private getTimeMs(tc: string): number {
    // Parse time control (e.g., "TWO_PLUS_ZERO" -> 2 minutes = 120000ms)
    const match = tc.match(/^(\w+)_PLUS_/);
    if (!match) return 120000; // Default 2 minutes

    const timeMap: { [key: string]: number } = {
      ONE: 60000,
      TWO: 120000,
      THREE: 180000,
      FIVE: 300000,
      TEN: 600000,
      FIFTEEN: 900000,
      THIRTY: 1800000,
      SIXTY: 3600000,
    };

    return timeMap[match[1]] || 120000;
  }

  /**
   * Helper to get increment in milliseconds from TimeControl enum
   */
  private getIncrementMs(tc: string): number {
    // Parse increment (e.g., "TWO_PLUS_ZERO" -> 0 seconds)
    const match = tc.match(/_PLUS_(\w+)$/);
    if (!match) return 0;

    const incMap: { [key: string]: number } = {
      ZERO: 0,
      ONE: 1000,
      TWO: 2000,
      THREE: 3000,
      FIVE: 5000,
      TEN: 10000,
      TWENTY: 20000,
    };

    return incMap[match[1]] || 0;
  }

  /**
   * Start auto-pairing for a tournament (called when tournament starts)
   */
  startAutoPairing(tournamentId: string): void {
    if (this.pairingIntervals.has(tournamentId)) {
      return; // Already running
    }

    // Attempt pairing every 5 seconds
    const interval = setInterval(async () => {
      try {
        await this.attemptPairing(tournamentId);
      } catch (error) {
        console.error(`Auto-pairing error for tournament ${tournamentId}:`, error);
      }
    }, 5000);

    this.pairingIntervals.set(tournamentId, interval);
    console.log(`Started auto-pairing for team tournament ${tournamentId}`);
  }

  /**
   * Stop auto-pairing for a tournament (called when tournament ends)
   */
  stopAutoPairing(tournamentId: string): void {
    const interval = this.pairingIntervals.get(tournamentId);
    if (interval) {
      clearInterval(interval);
      this.pairingIntervals.delete(tournamentId);
      console.log(`Stopped auto-pairing for team tournament ${tournamentId}`);
    }
  }

  /**
   * Clean up queue when tournament ends
   */
  async clearQueue(tournamentId: string): Promise<void> {
    const queueKey = this.getQueueKey(tournamentId);
    await this.redis.del(queueKey);

    // Clear all user queue status keys (we'll need to get the list of users first)
    const queue = await this.getQueue(tournamentId);
    for (const player of queue) {
      await this.redis.del(this.getUserQueueKey(tournamentId, player.userId));
    }

    console.log(`Cleared queue for team tournament ${tournamentId}`);
  }
}
