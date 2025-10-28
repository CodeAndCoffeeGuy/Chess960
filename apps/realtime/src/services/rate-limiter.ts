import { getRedisQueue } from '@chess960/redis-client';

export interface RateLimitConfig {
  windowSeconds: number;
  maxRequests: number;
  identifier: string; // e.g., 'move', 'message', 'queue_join'
}

export interface BulletGameRateLimits {
  // Per-user limits
  movesPerSecond: number;
  messagesPerMinute: number;
  reconnectsPerMinute: number;
  
  // Per-IP limits (for DDoS protection)
  connectionsPerMinute: number;
  
  // Game-specific limits
  premovesPerGame: number;
  drawOffersPerGame: number;
}

export const DEFAULT_BULLET_LIMITS: BulletGameRateLimits = {
  movesPerSecond: 10, // Very generous for bullet (allows premoves)
  messagesPerMinute: 100,
  reconnectsPerMinute: 5,
  connectionsPerMinute: 10,
  premovesPerGame: 3,
  drawOffersPerGame: 3,
};

export class EnhancedRateLimiter {
  private redisQueue = getRedisQueue();
  private limits: BulletGameRateLimits;

  constructor(limits: BulletGameRateLimits = DEFAULT_BULLET_LIMITS) {
    this.limits = limits;
  }

  /**
   * Check if user can make a move
   */
  async canMakeMove(userId: string): Promise<boolean> {
    return this.redisQueue.checkRateLimit(
      userId, 
      'move', 
      1, // 1 second window
      this.limits.movesPerSecond
    );
  }

  /**
   * Check if user can send a message
   */
  async canSendMessage(userId: string): Promise<boolean> {
    return this.redisQueue.checkRateLimit(
      userId, 
      'message', 
      60, // 1 minute window
      this.limits.messagesPerMinute
    );
  }

  /**
   * Check if user can reconnect
   */
  async canReconnect(userId: string): Promise<boolean> {
    return this.redisQueue.checkRateLimit(
      userId, 
      'reconnect', 
      60, // 1 minute window
      this.limits.reconnectsPerMinute
    );
  }

  /**
   * Check if IP can create new connections
   */
  async canConnect(ipAddress: string): Promise<boolean> {
    return this.redisQueue.checkRateLimit(
      `ip:${ipAddress}`, 
      'connect', 
      60, // 1 minute window
      this.limits.connectionsPerMinute
    );
  }

  /**
   * Check game-specific limits
   */
  async canOfferDraw(userId: string, gameId: string): Promise<boolean> {
    return this.redisQueue.checkRateLimit(
      `${userId}:${gameId}`, 
      'draw_offer', 
      3600, // 1 hour window (per game)
      this.limits.drawOffersPerGame
    );
  }

  /**
   * Check premove limits
   */
  async canPremove(userId: string, gameId: string): Promise<boolean> {
    return this.redisQueue.checkRateLimit(
      `${userId}:${gameId}`, 
      'premove', 
      3600, // 1 hour window (per game)
      this.limits.premovesPerGame
    );
  }

  /**
   * Advanced rate limiting with burst allowance
   */
  async checkBurstLimit(
    userId: string, 
    action: string, 
    burstLimit: number, 
    sustainedLimit: number, 
    burstWindowSeconds: number,
    sustainedWindowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    
    // Check burst limit (short window)
    const burstKey = `burst:${userId}:${action}`;
    const sustainedKey = `sustained:${userId}:${action}`;
    
    try {
      // Use Redis pipeline for atomic operations
      const pipeline = (this.redisQueue as any).client.multi();
      
      // Increment counters
      pipeline.incr(burstKey);
      pipeline.expire(burstKey, burstWindowSeconds);
      pipeline.incr(sustainedKey);
      pipeline.expire(sustainedKey, sustainedWindowSeconds);
      
      const results = await pipeline.exec();
      const burstCount = results[0][1];
      const sustainedCount = results[2][1];
      
      // Check both limits
      const burstAllowed = burstCount <= burstLimit;
      const sustainedAllowed = sustainedCount <= sustainedLimit;
      const allowed = burstAllowed && sustainedAllowed;
      
      return {
        allowed,
        remaining: Math.min(
          burstLimit - burstCount,
          sustainedLimit - sustainedCount
        ),
        resetTime: Date.now() + (sustainedWindowSeconds * 1000)
      };
      
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Fail open - allow the request if Redis is down
      return { allowed: true, remaining: -1, resetTime: 0 };
    }
  }

  /**
   * Bullet-game specific rate limiting
   * Allows burst of moves but prevents sustained abuse
   */
  async checkMoveRateLimit(userId: string): Promise<{ allowed: boolean; remaining: number }> {
    const result = await this.checkBurstLimit(
      userId,
      'move',
      5, // Allow 5 moves in burst (for premoves)
      20, // Max 20 moves per minute sustained
      5, // 5 second burst window
      60 // 1 minute sustained window
    );
    
    return {
      allowed: result.allowed,
      remaining: result.remaining
    };
  }

  /**
   * Get rate limit info for debugging/monitoring
   */
  async getRateLimitInfo(userId: string): Promise<{
    moves: { burst: number; sustained: number };
    messages: number;
    reconnects: number;
  }> {
    try {
      const pipeline = (this.redisQueue as any).client.multi();
      
      pipeline.get(`burst:${userId}:move`);
      pipeline.get(`sustained:${userId}:move`);
      pipeline.get(`ratelimit:${userId}:message`);
      pipeline.get(`ratelimit:${userId}:reconnect`);
      
      const results = await pipeline.exec();
      
      return {
        moves: {
          burst: parseInt(results[0][1] || '0'),
          sustained: parseInt(results[1][1] || '0')
        },
        messages: parseInt(results[2][1] || '0'),
        reconnects: parseInt(results[3][1] || '0')
      };
    } catch (error) {
      console.error('Error getting rate limit info:', error);
      return { moves: { burst: 0, sustained: 0 }, messages: 0, reconnects: 0 };
    }
  }

  /**
   * Reset rate limits for a user (admin function)
   */
  async resetUserLimits(userId: string): Promise<void> {
    try {
      const keys = [
        `burst:${userId}:*`,
        `sustained:${userId}:*`,
        `ratelimit:${userId}:*`
      ];
      
      for (const pattern of keys) {
        const matchingKeys = await (this.redisQueue as any).client.keys(pattern);
        if (matchingKeys.length > 0) {
          await (this.redisQueue as any).client.del(...matchingKeys);
        }
      }
    } catch (error) {
      console.error('Error resetting user limits:', error);
    }
  }

  /**
   * Get rate limiting statistics for monitoring
   */
  async getGlobalStats(): Promise<{
    activeUsers: number;
    totalRequests: number;
    blockedRequests: number;
  }> {
    // This would be implemented with Redis counters
    // For now, return placeholder data
    return {
      activeUsers: 0,
      totalRequests: 0,
      blockedRequests: 0
    };
  }
}

export default EnhancedRateLimiter;