import { getRedisClient } from '@chess960/utils';
import type { QueueEntry } from '../types';
import type { TimeControl } from '@chess960/proto';

export class RedisMatchmakingQueue {
  private redis = getRedisClient();
  
  private getQueueKey(tc: TimeControl, rated: boolean): string {
    return `queue:${tc}:${rated ? 'rated' : 'casual'}`;
  }

  private getUserDataKey(userId: string): string {
    return `queue:user:${userId}`;
  }

  private getUserQueueKey(userId: string): string {
    return `queue:user:${userId}:meta`;
  }

  async initialize(): Promise<void> {
    await this.redis.connect();
    console.log('Redis matchmaking queue initialized');
  }

  async addPlayer(entry: QueueEntry): Promise<boolean> {
    const queueKey = this.getQueueKey(entry.tc, entry.rated);
    const userDataKey = this.getUserDataKey(entry.userId);
    const userQueueKey = this.getUserQueueKey(entry.userId);

    try {
      // Check if user is already in a queue
      const existingQueue = await this.redis.getHash(userQueueKey);
      if (Object.keys(existingQueue).length > 0) {
        return false; // User already in queue
      }

      const multi = await this.redis.multi();
      
      // Add to sorted set with join timestamp as score (for FIFO with time-based priority)
      multi.zAdd(queueKey, { score: entry.joinedAt, value: entry.userId });
      
      // Store user data
      multi.setHash(userDataKey, {
        userId: entry.userId,
        tc: entry.tc,
        rated: entry.rated.toString(),
        rating: entry.rating.toString(),
        rd: entry.rd.toString(),
        joinedAt: entry.joinedAt.toString(),
      });

      // Store queue metadata for user
      multi.setHash(userQueueKey, {
        queueKey,
        joinedAt: entry.joinedAt.toString(),
      });

      // Set expiration (5 minutes)
      multi.expire(userDataKey, 300);
      multi.expire(userQueueKey, 300);

      await multi.exec();

      // Publish queue update
      await this.redis.publish('queue:update', JSON.stringify({
        action: 'join',
        userId: entry.userId,
        queueKey,
        timestamp: Date.now(),
      }));

      return true;
    } catch (error) {
      console.error('Error adding player to Redis queue:', error);
      return false;
    }
  }

  async removePlayer(userId: string): Promise<boolean> {
    const userQueueKey = this.getUserQueueKey(userId);
    const userDataKey = this.getUserDataKey(userId);

    try {
      // Get user's queue info
      const queueMeta = await this.redis.getHash(userQueueKey);
      if (Object.keys(queueMeta).length === 0) {
        return false; // User not in queue
      }

      const queueKey = queueMeta.queueKey;

      const multi = await this.redis.multi();
      
      // Remove from sorted set
      multi.zRem(queueKey, userId);
      
      // Clean up user data
      multi.deleteHash(userDataKey);
      multi.deleteHash(userQueueKey);

      await multi.exec();

      // Publish queue update
      await this.redis.publish('queue:update', JSON.stringify({
        action: 'leave',
        userId,
        queueKey,
        timestamp: Date.now(),
      }));

      return true;
    } catch (error) {
      console.error('Error removing player from Redis queue:', error);
      return false;
    }
  }

  async isPlayerInQueue(userId: string): Promise<boolean> {
    const userQueueKey = this.getUserQueueKey(userId);
    const queueMeta = await this.redis.getHash(userQueueKey);
    return Object.keys(queueMeta).length > 0;
  }

  async getPlayerQueue(userId: string): Promise<QueueEntry | null> {
    const userDataKey = this.getUserDataKey(userId);
    const userData = await this.redis.getHash(userDataKey);
    
    if (Object.keys(userData).length === 0) {
      return null;
    }

    return {
      userId: userData.userId,
      connection: null as any, // Will be set by the calling code
      tc: userData.tc as TimeControl,
      rated: userData.rated === 'true',
      rating: parseInt(userData.rating),
      rd: parseFloat(userData.rd),
      joinedAt: parseInt(userData.joinedAt),
    };
  }

  async findMatches(): Promise<Array<{ player1: QueueEntry; player2: QueueEntry }>> {
    const matches: Array<{ player1: QueueEntry; player2: QueueEntry }> = [];
    const now = Date.now();

    // Get all queue keys
    const queueKeys = [
      this.getQueueKey('1+0', true),
      this.getQueueKey('1+0', false),
      this.getQueueKey('2+0', true),
      this.getQueueKey('2+0', false),
    ];

    for (const queueKey of queueKeys) {
      const playersInQueue = await this.redis.getQueueRangeWithScores(queueKey, 0, -1);
      
      if (playersInQueue.length < 2) continue;

      // Get player data for all players in this queue
      const playerEntries: QueueEntry[] = [];
      
      for (const player of playersInQueue) {
        const userData = await this.redis.getHash(this.getUserDataKey(player.value));
        if (Object.keys(userData).length > 0) {
          playerEntries.push({
            userId: userData.userId,
            connection: null as any, // Will be set by calling code
            tc: userData.tc as TimeControl,
            rated: userData.rated === 'true',
            rating: parseInt(userData.rating),
            rd: parseFloat(userData.rd),
            joinedAt: parseInt(userData.joinedAt),
          });
        }
      }

      // Sort by rating (for better matches) but prioritize long waiters
      playerEntries.sort((a, b) => {
        const waitTimeA = now - a.joinedAt;
        const waitTimeB = now - b.joinedAt;
        
        // If someone has been waiting > 15 seconds, prioritize them
        if (waitTimeA > 15000 && waitTimeB <= 15000) return -1;
        if (waitTimeB > 15000 && waitTimeA <= 15000) return 1;
        
        // Otherwise sort by rating for better matches
        return Math.abs(a.rating - 1500) - Math.abs(b.rating - 1500);
      });

      // Find matches using our algorithm
      const matched = new Set<number>();
      
      for (let i = 0; i < playerEntries.length - 1; i++) {
        if (matched.has(i)) continue;
        
        const player1 = playerEntries[i];
        const waitTime1 = now - player1.joinedAt;
        
        for (let j = i + 1; j < playerEntries.length; j++) {
          if (matched.has(j)) continue;
          
          const player2 = playerEntries[j];
          const waitTime2 = now - player2.joinedAt;
          
          const maxWaitTime = Math.max(waitTime1, waitTime2) / 1000;
          const maxRatingDiff = this.calculateMaxRatingDiff(maxWaitTime);
          const ratingDiff = Math.abs(player1.rating - player2.rating);
          
          if (ratingDiff <= maxRatingDiff) {
            matches.push({ player1, player2 });
            matched.add(i);
            matched.add(j);
            
            // Remove both players from queue
            await this.removePlayer(player1.userId);
            await this.removePlayer(player2.userId);
            
            break;
          }
        }
      }
    }

    return matches;
  }

  private calculateMaxRatingDiff(waitTimeSeconds: number): number {
    const baseRatingDiff = 100;
    const increaseEvery = 3;
    const increaseAmount = 50;
    const maxRatingDiff = 400;
    
    const increases = Math.floor(waitTimeSeconds / increaseEvery);
    const calculatedDiff = baseRatingDiff + (increases * increaseAmount);
    
    return Math.min(calculatedDiff, maxRatingDiff);
  }

  async getQueueStats(): Promise<Record<string, { count: number; avgWait: number; avgRating: number }>> {
    const stats: Record<string, { count: number; avgWait: number; avgRating: number }> = {};
    const now = Date.now();

    const queueConfigs = [
      { tc: '1+0' as TimeControl, rated: true },
      { tc: '1+0' as TimeControl, rated: false },
      { tc: '2+0' as TimeControl, rated: true },
      { tc: '2+0' as TimeControl, rated: false },
    ];

    for (const config of queueConfigs) {
      const queueKey = this.getQueueKey(config.tc, config.rated);
      const playersInQueue = await this.redis.getQueueRangeWithScores(queueKey, 0, -1);
      
      if (playersInQueue.length === 0) {
        stats[queueKey] = { count: 0, avgWait: 0, avgRating: 0 };
        continue;
      }

      let totalWait = 0;
      let totalRating = 0;

      for (const player of playersInQueue) {
        const userData = await this.redis.getHash(this.getUserDataKey(player.value));
        if (Object.keys(userData).length > 0) {
          const joinedAt = parseInt(userData.joinedAt);
          const rating = parseInt(userData.rating);
          
          totalWait += (now - joinedAt);
          totalRating += rating;
        }
      }

      stats[queueKey] = {
        count: playersInQueue.length,
        avgWait: Math.round(totalWait / playersInQueue.length / 1000), // seconds
        avgRating: Math.round(totalRating / playersInQueue.length),
      };
    }

    return stats;
  }

  async getEstimatedWaitTime(tc: TimeControl, rated: boolean, userRating: number): Promise<number> {
    const queueKey = this.getQueueKey(tc, rated);
    const playersInQueue = await this.redis.getQueueRangeWithScores(queueKey, 0, -1);
    
    if (playersInQueue.length === 0) {
      return 5; // 5 seconds for empty queue
    }

    // Find similar rated players
    let similarPlayersCount = 0;
    let totalWait = 0;
    const now = Date.now();

    for (const player of playersInQueue) {
      const userData = await this.redis.getHash(this.getUserDataKey(player.value));
      if (Object.keys(userData).length > 0) {
        const playerRating = parseInt(userData.rating);
        const joinedAt = parseInt(userData.joinedAt);
        
        if (Math.abs(playerRating - userRating) <= 200) {
          similarPlayersCount++;
          totalWait += (now - joinedAt);
        }
      }
    }

    if (similarPlayersCount === 0) {
      return Math.min(5 + playersInQueue.length * 2, 30);
    }

    const avgWaitTime = totalWait / similarPlayersCount;
    return Math.round(avgWaitTime / 1000); // Convert to seconds
  }

  async cleanup(): Promise<void> {
    const maxWaitTime = 300 * 1000; // 5 minutes
    const now = Date.now();

    const queueKeys = [
      this.getQueueKey('1+0', true),
      this.getQueueKey('1+0', false),
      this.getQueueKey('2+0', true),
      this.getQueueKey('2+0', false),
    ];

    for (const queueKey of queueKeys) {
      const playersInQueue = await this.redis.getQueueRangeWithScores(queueKey, 0, -1);
      
      for (const player of playersInQueue) {
        const userData = await this.redis.getHash(this.getUserDataKey(player.value));
        if (Object.keys(userData).length > 0) {
          const joinedAt = parseInt(userData.joinedAt);
          
          if (now - joinedAt > maxWaitTime) {
            await this.removePlayer(player.value);
            console.log(`Removed expired player ${player.value} from queue`);
          }
        }
      }
    }
  }

  async getTotalPlayersInQueue(): Promise<number> {
    const queueKeys = [
      this.getQueueKey('1+0', true),
      this.getQueueKey('1+0', false),
      this.getQueueKey('2+0', true),
      this.getQueueKey('2+0', false),
    ];

    let total = 0;
    for (const queueKey of queueKeys) {
      total += await this.redis.getQueueSize(queueKey);
    }
    
    return total;
  }

  async clear(): Promise<void> {
    const queueKeys = [
      this.getQueueKey('1+0', true),
      this.getQueueKey('1+0', false),
      this.getQueueKey('2+0', true),
      this.getQueueKey('2+0', false),
    ];

    for (const queueKey of queueKeys) {
      const playersInQueue = await this.redis.getQueueRange(queueKey);
      
      const multi = await this.redis.multi();
      
      // Remove queue
      multi.del(queueKey);
      
      // Remove user data
      for (const userId of playersInQueue) {
        multi.deleteHash(this.getUserDataKey(userId));
        multi.deleteHash(this.getUserQueueKey(userId));
      }
      
      await multi.exec();
    }
    
    console.log('All matchmaking queues cleared');
  }
}