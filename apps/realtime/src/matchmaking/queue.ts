import type { QueueEntry } from '../types';
import type { TimeControl } from '@chess960/proto';

export class MatchmakingQueue {
  private queues = new Map<string, QueueEntry[]>(); // key: "tc-rated"
  private userQueues = new Map<string, string>(); // userId -> queue key

  private getQueueKey(tc: TimeControl, rated: boolean): string {
    return `${tc}-${rated}`;
  }

  addPlayer(entry: QueueEntry): boolean {
    const queueKey = this.getQueueKey(entry.tc, entry.rated);
    
    // Check if user already in a queue
    if (this.userQueues.has(entry.userId)) {
      return false;
    }

    // Get or create queue
    if (!this.queues.has(queueKey)) {
      this.queues.set(queueKey, []);
    }

    const queue = this.queues.get(queueKey)!;
    queue.push(entry);
    this.userQueues.set(entry.userId, queueKey);

    return true;
  }

  removePlayer(userId: string): boolean {
    const queueKey = this.userQueues.get(userId);
    if (!queueKey) {
      return false;
    }

    const queue = this.queues.get(queueKey);
    if (!queue) {
      return false;
    }

    const index = queue.findIndex(entry => entry.userId === userId);
    if (index === -1) {
      return false;
    }

    queue.splice(index, 1);
    this.userQueues.delete(userId);

    return true;
  }

  isPlayerInQueue(userId: string): boolean {
    return this.userQueues.has(userId);
  }

  getPlayerQueue(userId: string): QueueEntry | null {
    const queueKey = this.userQueues.get(userId);
    if (!queueKey) {
      return null;
    }

    const queue = this.queues.get(queueKey);
    if (!queue) {
      return null;
    }

    return queue.find(entry => entry.userId === userId) || null;
  }

  findMatches(): Array<{ player1: QueueEntry; player2: QueueEntry }> {
    const matches: Array<{ player1: QueueEntry; player2: QueueEntry }> = [];
    const now = Date.now();

    for (const [_queueKey, queue] of this.queues.entries()) {
      if (queue.length < 2) continue;

      // Sort by waiting time (longest first) then by rating
      queue.sort((a, b) => {
        const waitDiff = (now - a.joinedAt) - (now - b.joinedAt);
        if (Math.abs(waitDiff) > 1000) { // 1 second difference
          return waitDiff;
        }
        return Math.abs(a.rating - 1500) - Math.abs(b.rating - 1500); // Prefer closer to median
      });

      // Try to match players
      const matched = new Set<number>();
      
      for (let i = 0; i < queue.length - 1; i++) {
        if (matched.has(i)) continue;
        
        const player1 = queue[i];
        const waitTime1 = now - player1.joinedAt;
        
        for (let j = i + 1; j < queue.length; j++) {
          if (matched.has(j)) continue;
          
          const player2 = queue[j];
          const waitTime2 = now - player2.joinedAt;
          
          // Calculate max allowed rating difference based on wait time
          const maxWaitTime = Math.max(waitTime1, waitTime2) / 1000; // seconds
          const maxRatingDiff = this.calculateMaxRatingDiff(maxWaitTime);
          
          const ratingDiff = Math.abs(player1.rating - player2.rating);
          
          if (ratingDiff <= maxRatingDiff) {
            matches.push({ player1, player2 });
            matched.add(i);
            matched.add(j);
            break;
          }
        }
      }

      // Remove matched players from queue
      for (let i = queue.length - 1; i >= 0; i--) {
        if (matched.has(i)) {
          const entry = queue[i];
          queue.splice(i, 1);
          this.userQueues.delete(entry.userId);
        }
      }
    }

    return matches;
  }

  private calculateMaxRatingDiff(waitTimeSeconds: number): number {
    // Start with 100 rating difference, increase by 50 every 3 seconds, cap at 400
    const baseRatingDiff = 100;
    const increaseEvery = 3; // seconds
    const increaseAmount = 50;
    const maxRatingDiff = 400;
    
    const increases = Math.floor(waitTimeSeconds / increaseEvery);
    const calculatedDiff = baseRatingDiff + (increases * increaseAmount);
    
    return Math.min(calculatedDiff, maxRatingDiff);
  }

  getQueueStats(): Record<string, { count: number; avgWait: number; avgRating: number }> {
    const stats: Record<string, { count: number; avgWait: number; avgRating: number }> = {};
    const now = Date.now();

    for (const [queueKey, queue] of this.queues.entries()) {
      if (queue.length === 0) {
        stats[queueKey] = { count: 0, avgWait: 0, avgRating: 0 };
        continue;
      }

      const totalWait = queue.reduce((sum, entry) => sum + (now - entry.joinedAt), 0);
      const totalRating = queue.reduce((sum, entry) => sum + entry.rating, 0);

      stats[queueKey] = {
        count: queue.length,
        avgWait: Math.round(totalWait / queue.length / 1000), // seconds
        avgRating: Math.round(totalRating / queue.length),
      };
    }

    return stats;
  }

  getEstimatedWaitTime(tc: TimeControl, rated: boolean, userRating: number): number {
    const queueKey = this.getQueueKey(tc, rated);
    const queue = this.queues.get(queueKey);
    
    if (!queue || queue.length === 0) {
      return 5; // 5 seconds for empty queue
    }

    // Find similar rated players and estimate based on their wait times
    const similarPlayers = queue.filter(entry => 
      Math.abs(entry.rating - userRating) <= 200
    );

    if (similarPlayers.length === 0) {
      // If no similar players, estimate based on queue size
      return Math.min(5 + queue.length * 2, 30);
    }

    const now = Date.now();
    const avgWaitTime = similarPlayers.reduce((sum, entry) => 
      sum + (now - entry.joinedAt), 0
    ) / similarPlayers.length;

    return Math.round(avgWaitTime / 1000); // Convert to seconds
  }

  cleanup() {
    // Remove expired entries (players who waited too long)
    const maxWaitTime = 300 * 1000; // 5 minutes
    const now = Date.now();

    for (const [_queueKey, queue] of this.queues.entries()) {
      for (let i = queue.length - 1; i >= 0; i--) {
        const entry = queue[i];
        if (now - entry.joinedAt > maxWaitTime) {
          queue.splice(i, 1);
          this.userQueues.delete(entry.userId);
          
          // Notify player of timeout
          const timeoutMessage = {
            t: 'error',
            code: 'QUEUE_TIMEOUT',
            message: 'Queue timeout - please try again'
          };
          
          if (entry.connection.ws.readyState === 1) {
            entry.connection.ws.send(JSON.stringify(timeoutMessage));
          }
        }
      }
    }
  }

  // Get total players in all queues
  getTotalPlayersInQueue(): number {
    let total = 0;
    for (const queue of this.queues.values()) {
      total += queue.length;
    }
    return total;
  }

  // Clear all queues (for testing/cleanup)
  clear() {
    this.queues.clear();
    this.userQueues.clear();
  }
}