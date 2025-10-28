import { prisma } from '@chess960/db';
import { RedisClient } from '@chess960/redis-client';

export class TeamTournamentManager {
  private redis: RedisClient;

  constructor() {
    this.redis = RedisClient.getInstance();
  }

  /**
   * Start a team tournament
   */
  async startTournament(tournamentId: string): Promise<void> {
    const tournament = await prisma.teamTournament.findUnique({
      where: { id: tournamentId },
      include: {
        teamEntries: {
          include: {
            players: true,
          },
        },
      },
    });

    if (!tournament) {
      throw new Error('Team tournament not found');
    }

    if (tournament.status !== 'UPCOMING') {
      throw new Error('Tournament has already started or ended');
    }

    // Ensure all teams have at least one active player
    const validEntries = tournament.teamEntries.filter(
      (entry: any) => entry.players.some((p: any) => p.active) && !entry.withdrawn
    );

    if (validEntries.length < 2) {
      throw new Error('Not enough teams to start tournament');
    }

    // Update tournament status
    await prisma.teamTournament.update({
      where: { id: tournamentId },
      data: {
        status: 'LIVE',
      },
    });

    // Publish tournament start event
    await this.redis.publish('tournament:team:start', {
      tournamentId,
      timestamp: new Date().toISOString(),
    });

    console.log(`Team tournament ${tournamentId} started with ${validEntries.length} teams`);
  }

  /**
   * End a team tournament and determine winner
   */
  async endTournament(tournamentId: string): Promise<void> {
    const tournament = await prisma.teamTournament.findUnique({
      where: { id: tournamentId },
      include: {
        teamEntries: {
          orderBy: [
            { score: 'desc' },
            { wins: 'desc' },
          ],
        },
      },
    });

    if (!tournament) {
      throw new Error('Team tournament not found');
    }

    if (tournament.status !== 'LIVE') {
      throw new Error('Tournament is not currently active');
    }

    // Get the winning team (highest score)
    const winnerEntry = tournament.teamEntries[0];

    // Update tournament
    await prisma.teamTournament.update({
      where: { id: tournamentId },
      data: {
        status: 'FINISHED',
        endsAt: new Date(),
        winnerTeamId: winnerEntry?.teamId || null,
      },
    });

    // Publish tournament end event
    await this.redis.publish('tournament:team:end', {
      tournamentId,
      winnerTeamId: winnerEntry?.teamId,
      timestamp: new Date().toISOString(),
    });

    console.log(`Team tournament ${tournamentId} ended. Winner: Team ${winnerEntry?.teamId}`);
  }

  /**
   * Check if two players are on the same team
   */
  async arePlayersOnSameTeam(
    tournamentId: string,
    userId1: string,
    userId2: string
  ): Promise<boolean> {
    const entries = await prisma.teamTournamentEntry.findMany({
      where: {
        teamTournamentId: tournamentId,
      },
      include: {
        players: {
          where: {
            userId: {
              in: [userId1, userId2],
            },
          },
        },
      },
    });

    // Find if both players are in the same team
    for (const entry of entries) {
      const hasUser1 = entry.players.some((p: any) => p.userId === userId1);
      const hasUser2 = entry.players.some((p: any) => p.userId === userId2);

      if (hasUser1 && hasUser2) {
        return true; // Same team!
      }
    }

    return false;
  }

  /**
   * Calculate team score based on top N leaders
   * Only the top nbLeaders players' scores count toward team total
   */
  private async recalculateTeamScore(
    entryId: string,
    nbLeaders: number
  ): Promise<number> {
    // Get all players for this team entry, sorted by score
    const players = await prisma.teamTournamentPlayer.findMany({
      where: {
        entryId,
      },
      orderBy: {
        score: 'desc',
      },
      take: nbLeaders, // Only get top N
    });

    // Sum up the scores of top N players
    const teamScore = players.reduce((sum: number, player: any) => sum + player.score, 0);

    return teamScore;
  }

  /**
   * Record game result and update team scores
   */
  async recordGameResult(
    tournamentId: string,
    gameId: string,
    whiteId: string,
    blackId: string,
    result: string
  ): Promise<void> {
    const tournament = await prisma.teamTournament.findUnique({
      where: { id: tournamentId },
      include: {
        teamEntries: {
          include: {
            players: {
              where: {
                userId: {
                  in: [whiteId, blackId],
                },
              },
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

    // Find which teams these players belong to
    let whiteEntry: any = null;
    let blackEntry: any = null;
    let whitePlayer: any = null;
    let blackPlayer: any = null;

    for (const entry of tournament.teamEntries) {
      const wp = entry.players.find((p: any) => p.userId === whiteId);
      const bp = entry.players.find((p: any) => p.userId === blackId);

      if (wp) {
        whiteEntry = entry;
        whitePlayer = wp;
      }
      if (bp) {
        blackEntry = entry;
        blackPlayer = bp;
      }
    }

    if (!whiteEntry || !blackEntry || !whitePlayer || !blackPlayer) {
      throw new Error('Players not found in tournament');
    }

    // CRITICAL: Prevent same-team pairing
    // This should never happen, but double-check for safety
    if (whiteEntry.id === blackEntry.id) {
      throw new Error('Cannot pair players from the same team');
    }

    // Calculate base result stats
    let whiteWin = 0;
    let blackWin = 0;
    let whiteDraw = 0;
    let blackDraw = 0;
    let whiteLoss = 0;
    let blackLoss = 0;

    if (result === 'white') {
      whiteWin = 1;
      blackLoss = 1;
    } else if (result === 'black') {
      blackWin = 1;
      whiteLoss = 1;
    } else if (result === 'draw') {
      whiteDraw = 1;
      blackDraw = 1;
    }

    // Calculate new streaks based on result
    let whiteNewStreak = whitePlayer.streak;
    let blackNewStreak = blackPlayer.streak;

    if (whiteWin) {
      whiteNewStreak = whitePlayer.streak + 1; // Increment win streak
      blackNewStreak = 0; // Reset opponent's streak on loss
    } else if (blackWin) {
      blackNewStreak = blackPlayer.streak + 1; // Increment win streak
      whiteNewStreak = 0; // Reset opponent's streak on loss
    } else if (whiteDraw && blackDraw) {
      // Draws: keep streaks if >= 2, otherwise reset to 0
      whiteNewStreak = whitePlayer.streak >= 2 ? whitePlayer.streak : 0;
      blackNewStreak = blackPlayer.streak >= 2 ? blackPlayer.streak : 0;
    }

    // Calculate points with streak bonus (Chess960 Arena scoring)
    // Normal: 2 for win, 1 for draw, 0 for loss
    // On fire (streak >= 2): 4 for win, 2 for draw, 0 for loss (doubled!)
    const whiteOnFire = whitePlayer.streak >= 2;
    const blackOnFire = blackPlayer.streak >= 2;

    let whitePoints = 0;
    let blackPoints = 0;

    if (whiteWin) {
      whitePoints = whiteOnFire ? 4 : 2; // Doubled if on fire!
      blackPoints = 0;
    } else if (blackWin) {
      whitePoints = 0;
      blackPoints = blackOnFire ? 4 : 2; // Doubled if on fire!
    } else if (whiteDraw && blackDraw) {
      whitePoints = whiteOnFire ? 2 : 1; // Doubled if on fire!
      blackPoints = blackOnFire ? 2 : 1; // Doubled if on fire!
    }

    // Calculate performance ratings
    const whiteRating = whitePlayer.rating || 1500;
    const blackRating = blackPlayer.rating || 1500;

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

    const whiteNewGamesPlayed = whitePlayer.gamesPlayed + 1;
    const blackNewGamesPlayed = blackPlayer.gamesPlayed + 1;

    const whiteNewPerformance = this.calculateUpdatedPerformance(
      whitePlayer.performance,
      whiteNewGamesPlayed,
      whiteGamePerformance
    );
    const blackNewPerformance = this.calculateUpdatedPerformance(
      blackPlayer.performance,
      blackNewGamesPlayed,
      blackGamePerformance
    );

    // Update player stats
    await prisma.$transaction([
      // Update white player
      prisma.teamTournamentPlayer.update({
        where: {
          id: whitePlayer.id,
        },
        data: {
          score: { increment: whitePoints },
          gamesPlayed: { increment: 1 },
          wins: { increment: whiteWin },
          losses: { increment: whiteLoss },
          draws: { increment: whiteDraw },
          streak: whiteNewStreak, // Update win streak
          performance: whiteNewPerformance,
        },
      }),
      // Update black player
      prisma.teamTournamentPlayer.update({
        where: {
          id: blackPlayer.id,
        },
        data: {
          score: { increment: blackPoints },
          gamesPlayed: { increment: 1 },
          wins: { increment: blackWin },
          losses: { increment: blackLoss },
          draws: { increment: blackDraw },
          streak: blackNewStreak, // Update win streak
          performance: blackNewPerformance,
        },
      }),
      // Update white team entry stats (not score yet)
      prisma.teamTournamentEntry.update({
        where: {
          id: whiteEntry.id,
        },
        data: {
          gamesPlayed: { increment: 1 },
          wins: { increment: whiteWin },
          losses: { increment: whiteLoss },
          draws: { increment: whiteDraw },
        },
      }),
      // Update black team entry stats (not score yet)
      prisma.teamTournamentEntry.update({
        where: {
          id: blackEntry.id,
        },
        data: {
          gamesPlayed: { increment: 1 },
          wins: { increment: blackWin },
          losses: { increment: blackLoss },
          draws: { increment: blackDraw },
        },
      }),
    ]);

    // Recalculate team scores based on top nbLeaders
    const whiteTeamScore = await this.recalculateTeamScore(whiteEntry.id, tournament.nbLeaders);
    const blackTeamScore = await this.recalculateTeamScore(blackEntry.id, tournament.nbLeaders);

    // Update team scores
    await prisma.$transaction([
      prisma.teamTournamentEntry.update({
        where: { id: whiteEntry.id },
        data: { score: whiteTeamScore },
      }),
      prisma.teamTournamentEntry.update({
        where: { id: blackEntry.id },
        data: { score: blackTeamScore },
      }),
    ]);

    // Publish update
    await this.redis.publish('tournament:team:update', {
      tournamentId,
      gameId,
      whiteTeamId: whiteEntry.teamId,
      blackTeamId: blackEntry.teamId,
      result,
      timestamp: new Date().toISOString(),
    });

    console.log(
      `Team tournament ${tournamentId}: Team ${whiteEntry.teamId} vs Team ${blackEntry.teamId} - Result: ${result}`
    );
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
      return currentGamePerformance;
    }

    if (previousPerformance === null || previousPerformance === 0) {
      return currentGamePerformance;
    }

    const updated = (previousPerformance * (gamesPlayed - 1) + currentGamePerformance) / gamesPlayed;
    return Math.round(updated);
  }

  /**
   * Calculate comprehensive team statistics
   */
  async calculateTeamStats(entryId: string): Promise<{
    avgRating: number;
    avgPerformance: number;
    topPerformers: Array<{ userId: string; rating: number; performance: number; score: number }>;
    activePlayerCount: number;
    totalGamesPlayed: number;
  }> {
    const players = await prisma.teamTournamentPlayer.findMany({
      where: { entryId },
      orderBy: { score: 'desc' },
    });

    const activePlayers = players.filter((p: any) => p.active);

    // Calculate average rating
    const avgRating = activePlayers.length > 0
      ? Math.round(activePlayers.reduce((sum: number, p: any) => sum + p.rating, 0) / activePlayers.length)
      : 1500;

    // Calculate average performance (only for players who have played)
    const playersWithGames = activePlayers.filter((p: any) => p.gamesPlayed > 0 && p.performance !== null);
    const avgPerformance = playersWithGames.length > 0
      ? Math.round(playersWithGames.reduce((sum: number, p: any) => sum + (p.performance || 0), 0) / playersWithGames.length)
      : avgRating;

    // Get top 3 performers
    const topPerformers = activePlayers
      .filter((p: any) => p.gamesPlayed > 0)
      .slice(0, 3)
      .map((p: any) => ({
        userId: p.userId,
        rating: p.rating,
        performance: p.performance || p.rating,
        score: p.score,
      }));

    // Total games played by team
    const totalGamesPlayed = activePlayers.reduce((sum: number, p: any) => sum + p.gamesPlayed, 0);

    return {
      avgRating,
      avgPerformance,
      topPerformers,
      activePlayerCount: activePlayers.length,
      totalGamesPlayed,
    };
  }

  /**
   * Get team performance rating (average of all active players' performance ratings)
   */
  async getTeamPerformanceRating(entryId: string): Promise<number> {
    const players = await prisma.teamTournamentPlayer.findMany({
      where: {
        entryId,
        active: true,
        gamesPlayed: { gt: 0 },
      },
    });

    if (players.length === 0) {
      return 0;
    }

    const totalPerformance = players.reduce((sum: number, player: any) => {
      return sum + (player.performance || player.rating);
    }, 0);

    return Math.round(totalPerformance / players.length);
  }

  /**
   * Withdraw a team from the tournament
   */
  async withdrawTeam(tournamentId: string, teamId: string): Promise<void> {
    const entry = await prisma.teamTournamentEntry.findUnique({
      where: {
        teamTournamentId_teamId: {
          teamTournamentId: tournamentId,
          teamId,
        },
      },
    });

    if (!entry) {
      throw new Error('Team not found in tournament');
    }

    await prisma.teamTournamentEntry.update({
      where: {
        id: entry.id,
      },
      data: {
        withdrawn: true,
      },
    });

    await this.redis.publish('tournament:team:withdraw', {
      tournamentId,
      teamId,
      timestamp: new Date().toISOString(),
    });

    console.log(`Team ${teamId} withdrew from tournament ${tournamentId}`);
  }
}
