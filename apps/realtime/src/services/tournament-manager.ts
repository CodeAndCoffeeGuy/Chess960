import { prisma } from '@chess960/db';

interface TournamentPlayer {
  id: string;
  userId: string;
  tournamentId: string;
  rating: number;
  score: number;
  gamesPlayed: number;
  withdrawn: boolean;
  lastGameEndedAt: Date | null;
  currentGameId: string | null;
}

interface ActiveTournament {
  id: string;
  tc: string;
  status: string;
  endsAt: Date | null;
  players: TournamentPlayer[];
}

type BroadcastFunction = (userIds: string[], message: any) => void;

export class TournamentManager {
  private activeTournaments = new Map<string, ActiveTournament>();
  private userTournaments = new Map<string, string>(); // userId -> tournamentId
  private checkInterval: NodeJS.Timeout | null = null;
  private broadcastFn: BroadcastFunction | null = null;

  constructor() {
    this.startTournamentChecker();
  }

  /**
   * Set the broadcast function for WebSocket notifications
   */
  setBroadcastFunction(broadcastFn: BroadcastFunction) {
    this.broadcastFn = broadcastFn;
  }

  /**
   * Start checking for tournaments that need to be started or ended
   */
  private startTournamentChecker() {
    // Check every 5 seconds for tournaments to start/end
    this.checkInterval = setInterval(async () => {
      await this.checkTournamentLifecycle();
    }, 5000);

    // Run immediately on startup
    this.checkTournamentLifecycle();
  }

  /**
   * Check for tournaments that need lifecycle updates
   */
  private async checkTournamentLifecycle() {
    try {
      const now = new Date();

      // Find tournaments that should start
      const tournamentsToStart = await prisma.tournament.findMany({
        where: {
          status: 'UPCOMING',
          startsAt: {
            lte: now,
          },
        },
      });

      for (const tournament of tournamentsToStart) {
        await this.startTournament(tournament.id);
      }

      // Find tournaments that should end
      const tournamentsToEnd = await prisma.tournament.findMany({
        where: {
          status: 'LIVE',
          endsAt: {
            lte: now,
          },
        },
      });

      for (const tournament of tournamentsToEnd) {
        await this.endTournament(tournament.id);
      }

      // Find tournaments that will end in 1 minute (for countdown warning)
      const oneMinuteFromNow = new Date(now.getTime() + 60 * 1000);
      const tournamentsNearEnd = await prisma.tournament.findMany({
        where: {
          status: 'LIVE',
          endsAt: {
            gte: now,
            lte: oneMinuteFromNow,
          },
        },
        include: {
          players: {
            where: {
              withdrawn: false,
            },
          },
        },
      });

      for (const tournament of tournamentsNearEnd) {
        await this.sendCountdownWarning(tournament.id, tournament);
      }

      // Refresh active tournaments from database
      await this.loadActiveTournaments();
    } catch (error) {
      console.error('[TOURNAMENT] Error in lifecycle check:', error);
    }
  }

  /**
   * Start a tournament
   */
  private async startTournament(tournamentId: string) {
    try {
      console.log(`[TOURNAMENT] Starting tournament ${tournamentId}`);

      const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: {
          players: {
            where: {
              withdrawn: false,
            },
          },
        },
      });

      if (!tournament) {
        console.error(`[TOURNAMENT] Tournament ${tournamentId} not found`);
        return;
      }

      // Calculate end time
      const endsAt = new Date(tournament.startsAt.getTime() + tournament.duration * 60 * 1000);

      // Update tournament status
      await prisma.tournament.update({
        where: { id: tournamentId },
        data: {
          status: 'LIVE',
          endsAt,
        },
      });

      console.log(`[TOURNAMENT] Tournament ${tournamentId} started, will end at ${endsAt.toISOString()}`);

      // Broadcast to all tournament players
      if (this.broadcastFn && tournament.players.length > 0) {
        const playerIds = tournament.players.map((p: any) => p.userId);
        this.broadcastFn(playerIds, {
          type: 'tournament.started',
          tournamentId,
          name: tournament.name,
          duration: tournament.duration,
          endsAt: endsAt.toISOString(),
        });
        console.log(`[TOURNAMENT] Broadcasted start notification to ${playerIds.length} players`);
      }
    } catch (error) {
      console.error(`[TOURNAMENT] Failed to start tournament ${tournamentId}:`, error);
    }
  }

  /**
   * End a tournament
   */
  private async endTournament(tournamentId: string) {
    try {
      console.log(`[TOURNAMENT] Ending tournament ${tournamentId}`);

      // Get tournament with players
      const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: {
          players: {
            orderBy: [
              { score: 'desc' },
              { performance: 'desc' },
            ],
          },
        },
      });

      if (!tournament || tournament.players.length === 0) {
        await prisma.tournament.update({
          where: { id: tournamentId },
          data: { status: 'FINISHED' },
        });
        return;
      }

      // Determine winner (highest score)
      const winner = tournament.players[0];

      // Find ongoing games for tournament participants
      const playerIds = tournament.players.map((p: any) => p.userId);
      const ongoingGames = await prisma.game.findMany({
        where: {
          OR: [
            { whiteId: { in: playerIds } },
            { blackId: { in: playerIds } },
          ],
          result: 'ongoing',
        },
        select: {
          id: true,
          whiteId: true,
          blackId: true,
        },
      });

      if (ongoingGames.length > 0) {
        console.log(`[TOURNAMENT] Found ${ongoingGames.length} ongoing games that will not count for tournament`);

        // Notify players in ongoing games that their game won't count
        if (this.broadcastFn) {
          for (const game of ongoingGames) {
            // Filter out null whiteId/blackId
            const recipients = [game.whiteId, game.blackId].filter((id): id is string => id !== null);
            if (recipients.length > 0) {
              this.broadcastFn(recipients, {
                type: 'tournament.game.finishing',
                tournamentId,
                gameId: game.id,
                message: 'Tournament has ended. This game will not count for the tournament.',
              });
            }
          }
        }
      }

      // Update tournament status and winner
      await prisma.tournament.update({
        where: { id: tournamentId },
        data: {
          status: 'FINISHED',
          winnerId: winner.userId,
        },
      });

      // Broadcast to all tournament players
      if (this.broadcastFn && tournament.players.length > 0) {
        const standings = tournament.players.map((p: any, index: number) => ({
          rank: index + 1,
          userId: p.userId,
          score: p.score,
          wins: p.wins,
          losses: p.losses,
          draws: p.draws,
          gamesPlayed: p.gamesPlayed,
        }));

        this.broadcastFn(playerIds, {
          type: 'tournament.ended',
          tournamentId,
          name: tournament.name,
          winnerId: winner.userId,
          standings,
        });
        console.log(`[TOURNAMENT] Broadcasted end notification to ${playerIds.length} players`);
      }

      // Remove from active tournaments
      this.activeTournaments.delete(tournamentId);

      // Remove user mappings
      for (const player of tournament.players) {
        if (this.userTournaments.get(player.userId) === tournamentId) {
          this.userTournaments.delete(player.userId);
        }
      }

      console.log(`[TOURNAMENT] Tournament ${tournamentId} ended, winner: ${winner.userId}`);
    } catch (error) {
      console.error(`[TOURNAMENT] Failed to end tournament ${tournamentId}:`, error);
    }
  }

  /**
   * Send countdown warning to tournament players
   */
  private warningsSent = new Set<string>(); // Track tournaments that have already received warning

  private async sendCountdownWarning(tournamentId: string, tournament: any) {
    try {
      // Only send warning once per tournament
      if (this.warningsSent.has(tournamentId)) {
        return;
      }

      this.warningsSent.add(tournamentId);

      if (this.broadcastFn && tournament.players.length > 0) {
        const playerIds = tournament.players.map((p: any) => p.userId);
        const endsAt = tournament.endsAt;
        const timeRemaining = Math.floor((endsAt.getTime() - Date.now()) / 1000); // seconds

        this.broadcastFn(playerIds, {
          type: 'tournament.countdown',
          tournamentId,
          name: tournament.name,
          timeRemaining,
          message: '1 minute remaining!',
        });

        console.log(`[TOURNAMENT] Sent countdown warning for tournament ${tournamentId} to ${playerIds.length} players`);
      }
    } catch (error) {
      console.error(`[TOURNAMENT] Failed to send countdown warning for ${tournamentId}:`, error);
    }
  }

  /**
   * Load active tournaments from database
   */
  private async loadActiveTournaments() {
    try {
      const liveTournaments = await prisma.tournament.findMany({
        where: {
          status: 'LIVE',
        },
        include: {
          players: {
            where: {
              withdrawn: false,
            },
          },
        },
      });

      // Update active tournaments map
      for (const tournament of liveTournaments) {
        const players: TournamentPlayer[] = tournament.players.map((p: any) => ({
          id: p.id,
          userId: p.userId,
          tournamentId: tournament.id,
          rating: p.rating,
          score: p.score,
          gamesPlayed: p.gamesPlayed,
          withdrawn: p.withdrawn,
          lastGameEndedAt: null, // We'll track this in memory
          currentGameId: null,
        }));

        this.activeTournaments.set(tournament.id, {
          id: tournament.id,
          tc: tournament.tc,
          status: tournament.status,
          endsAt: tournament.endsAt,
          players,
        });

        // Update user -> tournament mapping
        for (const player of players) {
          this.userTournaments.set(player.userId, tournament.id);
        }
      }
    } catch (error) {
      console.error('[TOURNAMENT] Failed to load active tournaments:', error);
    }
  }

  /**
   * Check if user is in an active tournament
   */
  isUserInTournament(userId: string): boolean {
    return this.userTournaments.has(userId);
  }

  /**
   * Get tournament ID for a user
   */
  getUserTournament(userId: string): string | null {
    return this.userTournaments.get(userId) || null;
  }

  /**
   * Get tournament by ID
   */
  getTournament(tournamentId: string): ActiveTournament | null {
    return this.activeTournaments.get(tournamentId) || null;
  }

  /**
   * Find a pairing for a tournament player
   * Returns opponent userId or null if no suitable opponent found
   */
  findTournamentPairing(userId: string): string | null {
    const tournamentId = this.userTournaments.get(userId);
    if (!tournamentId) return null;

    const tournament = this.activeTournaments.get(tournamentId);
    if (!tournament) return null;

    const player = tournament.players.find((p: any) => p.userId === userId);
    if (!player) return null;

    // Find available opponents (not in game, not withdrawn, not the same player)
    const now = Date.now();
    const minTimeBetweenGames = 2000; // 2 seconds minimum between games

    const availableOpponents = tournament.players.filter(p => {
      if (p.userId === userId) return false;
      if (p.withdrawn) return false;
      if (p.currentGameId) return false; // Already in a game

      // Check if enough time has passed since last game
      if (p.lastGameEndedAt) {
        const timeSinceLastGame = now - p.lastGameEndedAt.getTime();
        if (timeSinceLastGame < minTimeBetweenGames) return false;
      }

      return true;
    });

    if (availableOpponents.length === 0) return null;

    // Sort by rating proximity
    availableOpponents.sort((a, b) => {
      const diffA = Math.abs(a.rating - player.rating);
      const diffB = Math.abs(b.rating - player.rating);
      return diffA - diffB;
    });

    // Return the closest rated available opponent
    return availableOpponents[0].userId;
  }

  /**
   * Mark player as in game
   */
  markPlayerInGame(userId: string, gameId: string) {
    const tournamentId = this.userTournaments.get(userId);
    if (!tournamentId) return;

    const tournament = this.activeTournaments.get(tournamentId);
    if (!tournament) return;

    const player = tournament.players.find((p: any) => p.userId === userId);
    if (player) {
      player.currentGameId = gameId;
    }
  }

  /**
   * Mark player as available (game ended)
   */
  markPlayerAvailable(userId: string) {
    const tournamentId = this.userTournaments.get(userId);
    if (!tournamentId) return;

    const tournament = this.activeTournaments.get(tournamentId);
    if (!tournament) return;

    const player = tournament.players.find((p: any) => p.userId === userId);
    if (player) {
      player.currentGameId = null;
      player.lastGameEndedAt = new Date();
    }
  }

  /**
   * Record a tournament game result
   */
  async recordGameResult(
    gameId: string,
    whiteId: string,
    blackId: string,
    result: string
  ) {
    try {
      // Check if either player is in a tournament
      const tournamentId = this.userTournaments.get(whiteId) || this.userTournaments.get(blackId);
      if (!tournamentId) return;

      // Verify both players are in the same tournament
      const whiteTournamentId = this.userTournaments.get(whiteId);
      const blackTournamentId = this.userTournaments.get(blackId);

      if (whiteTournamentId !== blackTournamentId) {
        console.log(`[TOURNAMENT] Players in different tournaments, not recording as tournament game`);
        return;
      }

      // Check if tournament is still LIVE
      const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        select: { status: true },
      });

      if (!tournament || tournament.status !== 'LIVE') {
        console.log(`[TOURNAMENT] Tournament ${tournamentId} is not LIVE, game will not count for tournament`);
        // Mark players as available but don't record score
        this.markPlayerAvailable(whiteId);
        this.markPlayerAvailable(blackId);
        return;
      }

      console.log(`[TOURNAMENT] Recording game result for tournament ${tournamentId}`);

      // Mark both players as available
      this.markPlayerAvailable(whiteId);
      this.markPlayerAvailable(blackId);

      // Get current player stats (including streaks, consecutive losses, performance, and rating) before updating
      const currentPlayers = await prisma.tournamentPlayer.findMany({
        where: {
          tournamentId,
          userId: { in: [whiteId, blackId] },
        },
        select: {
          userId: true,
          streak: true,
          consecutiveLosses: true,
          performance: true,
          rating: true,
          gamesPlayed: true,
        },
      });

      const whitePlayer = currentPlayers.find((p: any) => p.userId === whiteId);
      const blackPlayer = currentPlayers.find((p: any) => p.userId === blackId);

      const whiteCurrentStreak = whitePlayer?.streak || 0;
      const blackCurrentStreak = blackPlayer?.streak || 0;

      // Calculate scores
      let whiteScore = 0;
      let blackScore = 0;
      let whiteWin = 0, whiteLoss = 0, whiteDraw = 0;
      let blackWin = 0, blackLoss = 0, blackDraw = 0;
      let whiteNewStreak = 0;
      let blackNewStreak = 0;

      // Parse result (examples: 'checkmate-white', 'checkmate-black', 'draw', 'resign-white', 'flag-black', etc.)
      if (result.includes('white')) {
        // White lost, Black won
        blackWin = 1;
        whiteLoss = 1;
        blackNewStreak = blackCurrentStreak + 1;
        whiteNewStreak = 0; // Reset streak on loss

        // Base points
        blackScore = 2;
        whiteScore = 0;

        // Win streak bonus: double points if streak >= 2 (before this win)
        if (blackCurrentStreak >= 2) {
          blackScore = 4; // Double points
          console.log(`[TOURNAMENT] ${blackId} on fire! Streak ${blackCurrentStreak} → ${blackNewStreak}, earning ${blackScore} points`);
        }
      } else if (result.includes('black')) {
        // Black lost, White won
        whiteWin = 1;
        blackLoss = 1;
        whiteNewStreak = whiteCurrentStreak + 1;
        blackNewStreak = 0; // Reset streak on loss

        // Base points
        whiteScore = 2;
        blackScore = 0;

        // Win streak bonus: double points if streak >= 2 (before this win)
        if (whiteCurrentStreak >= 2) {
          whiteScore = 4; // Double points
          console.log(`[TOURNAMENT] ${whiteId} on fire! Streak ${whiteCurrentStreak} → ${whiteNewStreak}, earning ${whiteScore} points`);
        }
      } else if (result === 'draw' || result === '1/2-1/2') {
        // Draw
        whiteDraw = 1;
        blackDraw = 1;
        whiteNewStreak = 0; // Reset streak on draw
        blackNewStreak = 0; // Reset streak on draw

        // Base points
        whiteScore = 1;
        blackScore = 1;

        // Win streak bonus: if on streak, double the draw points
        if (whiteCurrentStreak >= 2) {
          whiteScore = 2; // Double points
          console.log(`[TOURNAMENT] ${whiteId} on fire! Streak ${whiteCurrentStreak} continues with draw, earning ${whiteScore} points`);
        }
        if (blackCurrentStreak >= 2) {
          blackScore = 2; // Double points
          console.log(`[TOURNAMENT] ${blackId} on fire! Streak ${blackCurrentStreak} continues with draw, earning ${blackScore} points`);
        }
      } else if (result === 'abort' || result === 'timeout-start') {
        // Aborted games don't count
        console.log(`[TOURNAMENT] Game aborted, not counting for tournament`);
        return;
      }

      // Calculate anti-ragequit delays
      const whiteConsecutiveLosses = whiteLoss > 0 ? (currentPlayers.find((p: any) => p.userId === whiteId)?.consecutiveLosses || 0) + 1 : 0;
      const blackConsecutiveLosses = blackLoss > 0 ? (currentPlayers.find((p: any) => p.userId === blackId)?.consecutiveLosses || 0) + 1 : 0;

      // Escalating delay: 10s for 1st loss, increases by 10s each loss, caps at 120s
      const calculateDelay = (losses: number): number => {
        if (losses === 0) return 0;
        return Math.min(losses * 10, 120);
      };

      const whiteDelaySeconds = calculateDelay(whiteConsecutiveLosses);
      const blackDelaySeconds = calculateDelay(blackConsecutiveLosses);

      const now = new Date();
      const whiteDelayUntil = whiteDelaySeconds > 0 ? new Date(now.getTime() + whiteDelaySeconds * 1000) : null;
      const blackDelayUntil = blackDelaySeconds > 0 ? new Date(now.getTime() + blackDelaySeconds * 1000) : null;

      if (whiteDelaySeconds > 0) {
        console.log(`[TOURNAMENT] ${whiteId} has ${whiteConsecutiveLosses} consecutive losses, applying ${whiteDelaySeconds}s delay until ${whiteDelayUntil?.toISOString()}`);
      }
      if (blackDelaySeconds > 0) {
        console.log(`[TOURNAMENT] ${blackId} has ${blackConsecutiveLosses} consecutive losses, applying ${blackDelaySeconds}s delay until ${blackDelayUntil?.toISOString()}`);
      }

      // Calculate performance ratings
      // Get opponent ratings
      const whiteRating = whitePlayer?.rating || 1500;
      const blackRating = blackPlayer?.rating || 1500;

      // Calculate game performance for each player
      const whiteGamePerformance = this.calculateGamePerformance(
        blackRating,
        whiteWin > 0,
        whiteDraw > 0
      );
      const blackGamePerformance = this.calculateGamePerformance(
        whiteRating,
        blackWin > 0,
        blackDraw > 0
      );

      // Calculate new games played count (current + 1)
      const whiteNewGamesPlayed = (whitePlayer?.gamesPlayed || 0) + 1;
      const blackNewGamesPlayed = (blackPlayer?.gamesPlayed || 0) + 1;

      // Update running average performance
      const whiteNewPerformance = this.calculateUpdatedPerformance(
        whitePlayer?.performance ?? null,
        whiteNewGamesPlayed,
        whiteGamePerformance
      );
      const blackNewPerformance = this.calculateUpdatedPerformance(
        blackPlayer?.performance ?? null,
        blackNewGamesPlayed,
        blackGamePerformance
      );

      console.log(`[TOURNAMENT] ${whiteId} performance: ${whiteGamePerformance} this game → ${whiteNewPerformance} avg (${whiteNewGamesPlayed} games)`);
      console.log(`[TOURNAMENT] ${blackId} performance: ${blackGamePerformance} this game → ${blackNewPerformance} avg (${blackNewGamesPlayed} games)`);

      // Update white player stats
      await prisma.tournamentPlayer.update({
        where: {
          tournamentId_userId: {
            tournamentId,
            userId: whiteId,
          },
        },
        data: {
          score: {
            increment: whiteScore,
          },
          gamesPlayed: {
            increment: 1,
          },
          wins: {
            increment: whiteWin,
          },
          losses: {
            increment: whiteLoss,
          },
          draws: {
            increment: whiteDraw,
          },
          streak: whiteNewStreak,
          consecutiveLosses: whiteConsecutiveLosses,
          pairingDelay: whiteDelaySeconds,
          delayUntil: whiteDelayUntil,
          performance: whiteNewPerformance,
        },
      });

      // Update black player stats
      await prisma.tournamentPlayer.update({
        where: {
          tournamentId_userId: {
            tournamentId,
            userId: blackId,
          },
        },
        data: {
          score: {
            increment: blackScore,
          },
          gamesPlayed: {
            increment: 1,
          },
          wins: {
            increment: blackWin,
          },
          losses: {
            increment: blackLoss,
          },
          draws: {
            increment: blackDraw,
          },
          streak: blackNewStreak,
          consecutiveLosses: blackConsecutiveLosses,
          pairingDelay: blackDelaySeconds,
          delayUntil: blackDelayUntil,
          performance: blackNewPerformance,
        },
      });

      // Create tournament pairing record
      await prisma.tournamentPairing.create({
        data: {
          tournamentId,
          gameId,
          whiteId,
          blackId,
          status: 'COMPLETED' as any,
          result,
        },
      });

      console.log(`[TOURNAMENT] Updated stats for tournament ${tournamentId}, white: +${whiteScore}, black: +${blackScore}`);

      // Update local cache
      const cachedTournament = this.activeTournaments.get(tournamentId);
      if (cachedTournament) {
        const whitePlayer = cachedTournament.players.find((p: any) => p.userId === whiteId);
        const blackPlayer = cachedTournament.players.find((p: any) => p.userId === blackId);

        if (whitePlayer) {
          whitePlayer.score += whiteScore;
          whitePlayer.gamesPlayed += 1;
        }

        if (blackPlayer) {
          blackPlayer.score += blackScore;
          blackPlayer.gamesPlayed += 1;
        }
      }
    } catch (error) {
      console.error('[TOURNAMENT] Failed to record game result:', error);
    }
  }

  /**
   * Calculate performance rating for a single game
   * Formula: Opponent Rating ± 500
   * - Win: Opponent Rating + 500
   * - Draw: Opponent Rating + 0
   * - Loss: Opponent Rating - 500
   */
  private calculateGamePerformance(opponentRating: number, isWin: boolean, isDraw: boolean): number {
    if (isDraw) {
      return opponentRating;
    }
    return opponentRating + (isWin ? 500 : -500);
  }

  /**
   * Update running average performance after a game
   * Formula: (Previous Performance × (N - 1) + Current Game Performance) / N
   */
  private calculateUpdatedPerformance(
    previousPerformance: number | null,
    gamesPlayed: number,
    currentGamePerformance: number
  ): number {
    if (gamesPlayed === 1) {
      // First game
      return currentGamePerformance;
    }

    if (previousPerformance === null || previousPerformance === 0) {
      // No previous performance, treat as first game
      return currentGamePerformance;
    }

    // Running average
    const updated = (previousPerformance * (gamesPlayed - 1) + currentGamePerformance) / gamesPlayed;
    return Math.round(updated);
  }

  /**
   * Get all available tournament players (for matchmaking)
   */
  getAvailableTournamentPlayers(): Array<{ userId: string; tournamentId: string; rating: number; tc: string }> {
    const available: Array<{ userId: string; tournamentId: string; rating: number; tc: string }> = [];

    for (const [tournamentId, tournament] of this.activeTournaments.entries()) {
      const now = Date.now();
      const minTimeBetweenGames = 2000;

      for (const player of tournament.players) {
        if (player.withdrawn) continue;
        if (player.currentGameId) continue;

        // Check if enough time has passed since last game
        if (player.lastGameEndedAt) {
          const timeSinceLastGame = now - player.lastGameEndedAt.getTime();
          if (timeSinceLastGame < minTimeBetweenGames) continue;
        }

        available.push({
          userId: player.userId,
          tournamentId,
          rating: player.rating,
          tc: tournament.tc,
        });
      }
    }

    return available;
  }

  /**
   * Clean up and stop the tournament manager
   */
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

// Singleton instance
let tournamentManager: TournamentManager | null = null;

export function getTournamentManager(): TournamentManager {
  if (!tournamentManager) {
    tournamentManager = new TournamentManager();
  }
  return tournamentManager;
}
