import { db } from '../src/index';

interface UserStats {
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  gamesDrawn: number;
}

async function recalculateUserStats() {
  console.log('Starting user stats recalculation...');

  try {
    // Get all completed games (excluding aborts)
    const games = await db.game.findMany({
      where: {
        result: { not: 'abort' },
        endedAt: { not: null },
      },
      select: {
        whiteId: true,
        blackId: true,
        result: true,
      },
    });

    console.log(`Found ${games.length} completed games`);

    // Calculate stats for each user
    const userStatsMap = new Map<string, UserStats>();

    games.forEach((game) => {
      if (!game.whiteId || !game.blackId) return;

      // Initialize user stats if not exists
      if (!userStatsMap.has(game.whiteId)) {
        userStatsMap.set(game.whiteId, { gamesPlayed: 0, gamesWon: 0, gamesLost: 0, gamesDrawn: 0 });
      }
      if (!userStatsMap.has(game.blackId)) {
        userStatsMap.set(game.blackId, { gamesPlayed: 0, gamesWon: 0, gamesLost: 0, gamesDrawn: 0 });
      }

      const whiteStats = userStatsMap.get(game.whiteId)!;
      const blackStats = userStatsMap.get(game.blackId)!;

      // Increment games played
      whiteStats.gamesPlayed++;
      blackStats.gamesPlayed++;

      // Determine result and update win/loss/draw counts
      switch (game.result) {
        case '1-0':
        case 'flag-black':
        case 'resign-black':
          whiteStats.gamesWon++;
          blackStats.gamesLost++;
          break;
        case '0-1':
        case 'flag-white':
        case 'resign-white':
          whiteStats.gamesLost++;
          blackStats.gamesWon++;
          break;
        case '1/2-1/2':
          whiteStats.gamesDrawn++;
          blackStats.gamesDrawn++;
          break;
        default:
          console.warn(`Unknown game result: ${game.result}`);
      }
    });

    console.log(`Calculated stats for ${userStatsMap.size} users`);

    // Update each user's stats
    let updatedCount = 0;
    for (const [userId, stats] of userStatsMap.entries()) {
      await db.user.update({
        where: { id: userId },
        data: {
          gamesPlayed: stats.gamesPlayed,
          gamesWon: stats.gamesWon,
          gamesLost: stats.gamesLost,
          gamesDrawn: stats.gamesDrawn,
        },
      });
      updatedCount++;

      if (updatedCount % 10 === 0) {
        console.log(`Updated ${updatedCount}/${userStatsMap.size} users...`);
      }
    }

    console.log(`Successfully updated stats for ${updatedCount} users`);

    // Print sample stats for verification
    const sampleUsers = Array.from(userStatsMap.entries()).slice(0, 5);
    console.log('\nSample user stats:');
    for (const [userId, stats] of sampleUsers) {
      const user = await db.user.findUnique({ where: { id: userId }, select: { handle: true } });
      console.log(`  ${user?.handle || userId}: ${stats.gamesPlayed} games (W:${stats.gamesWon} L:${stats.gamesLost} D:${stats.gamesDrawn})`);
    }

  } catch (error) {
    console.error('Error recalculating user stats:', error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

recalculateUserStats()
  .then(() => {
    console.log('\nUser stats recalculation completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nUser stats recalculation failed:', error);
    process.exit(1);
  });
