import { createClient, RedisClientType } from 'redis';

export interface GameEvent {
  type: 'move' | 'game_start' | 'game_end' | 'time_update' | 'draw_offer' | 'chat';
  gameId: string;
  userId?: string;
  data: any;
  timestamp: number;
}

export interface UserEvent {
  type: 'user_online' | 'user_offline' | 'queue_join' | 'queue_leave';
  userId: string;
  data: any;
  timestamp: number;
}

export class RedisMessageQueue {
  private client: RedisClientType;
  private subscriber: RedisClientType;
  private publisher: RedisClientType;
  private static instance: RedisMessageQueue | null = null;

  constructor(redisUrl?: string) {
    const url = redisUrl || process.env.REDIS_URL || 'redis://localhost:6379';

    this.client = createClient({ url });
    this.subscriber = createClient({ url });
    this.publisher = createClient({ url });
  }

  static getInstance(redisUrl?: string): RedisMessageQueue {
    if (!RedisMessageQueue.instance) {
      RedisMessageQueue.instance = new RedisMessageQueue(redisUrl);
    }
    return RedisMessageQueue.instance;
  }

  async connect(): Promise<void> {
    await Promise.all([
      this.client.connect(),
      this.subscriber.connect(),
      this.publisher.connect()
    ]);
  }

  async disconnect(): Promise<void> {
    await Promise.all([
      this.client.disconnect(),
      this.subscriber.disconnect(),
      this.publisher.disconnect()
    ]);
  }

  // Pub/Sub methods
  async publish(channel: string, message: any): Promise<void> {
    await this.publisher.publish(channel, JSON.stringify(message));
  }

  async subscribe(channel: string, callback: (data: any) => void): Promise<void> {
    await this.subscriber.subscribe(channel, (message) => {
      try {
        const data = JSON.parse(message);
        callback(data);
      } catch (error) {
        console.error('Error parsing message:', error);
        callback(message);
      }
    });
  }

  async unsubscribe(channel: string): Promise<void> {
    await this.subscriber.unsubscribe(channel);
  }

  // Direct Redis operations
  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.setEx(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async zadd(key: string, score: number, member: string): Promise<void> {
    await this.client.zAdd(key, { score, value: member });
  }

  async zrem(key: string, member: string): Promise<void> {
    await this.client.zRem(key, member);
  }

  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    return await this.client.zRange(key, start, stop);
  }

  async zcard(key: string): Promise<number> {
    return await this.client.zCard(key);
  }

  // Game event channels
  async publishGameEvent(event: GameEvent): Promise<void> {
    const channel = `game:${event.gameId}`;
    await this.publisher.publish(channel, JSON.stringify(event));
  }

  async subscribeToGame(gameId: string, callback: (event: GameEvent) => void): Promise<void> {
    const channel = `game:${gameId}`;
    await this.subscriber.subscribe(channel, (message) => {
      try {
        const event = JSON.parse(message) as GameEvent;
        callback(event);
      } catch (error) {
        console.error('Error parsing game event:', error);
      }
    });
  }

  async unsubscribeFromGame(gameId: string): Promise<void> {
    const channel = `game:${gameId}`;
    await this.subscriber.unsubscribe(channel);
  }

  // User event channels
  async publishUserEvent(event: UserEvent): Promise<void> {
    const channel = `user:${event.userId}`;
    await this.publisher.publish(channel, JSON.stringify(event));
  }

  async subscribeToUser(userId: string, callback: (event: UserEvent) => void): Promise<void> {
    const channel = `user:${userId}`;
    await this.subscriber.subscribe(channel, (message) => {
      try {
        const event = JSON.parse(message) as UserEvent;
        callback(event);
      } catch (error) {
        console.error('Error parsing user event:', error);
      }
    });
  }

  // Global events (matchmaking, system announcements)
  async publishGlobalEvent(type: string, data: any): Promise<void> {
    const event = {
      type,
      data,
      timestamp: Date.now()
    };
    await this.publisher.publish('global', JSON.stringify(event));
  }

  async subscribeToGlobalEvents(callback: (event: any) => void): Promise<void> {
    await this.subscriber.subscribe('global', (message) => {
      try {
        const event = JSON.parse(message);
        callback(event);
      } catch (error) {
        console.error('Error parsing global event:', error);
      }
    });
  }

  // Game state persistence
  async setGameState(gameId: string, state: any): Promise<void> {
    const key = `gamestate:${gameId}`;
    await this.client.setEx(key, 3600, JSON.stringify(state)); // 1 hour TTL
  }

  async getGameState(gameId: string): Promise<any | null> {
    const key = `gamestate:${gameId}`;
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async deleteGameState(gameId: string): Promise<void> {
    const key = `gamestate:${gameId}`;
    await this.client.del(key);
  }

  // User session management
  async setUserSession(userId: string, sessionData: any): Promise<void> {
    const key = `session:${userId}`;
    await this.client.setEx(key, 86400, JSON.stringify(sessionData)); // 24 hours TTL
  }

  async getUserSession(userId: string): Promise<any | null> {
    const key = `session:${userId}`;
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async deleteUserSession(userId: string): Promise<void> {
    const key = `session:${userId}`;
    await this.client.del(key);
  }

  // Rate limiting
  async checkRateLimit(userId: string, action: string, windowSeconds: number = 60, maxActions: number = 30): Promise<boolean> {
    const key = `ratelimit:${userId}:${action}`;
    const count = await this.client.incr(key);
    
    if (count === 1) {
      await this.client.expire(key, windowSeconds);
    }
    
    return count <= maxActions;
  }
}

// Singleton instance
let redisQueue: RedisMessageQueue | null = null;

export function getRedisQueue(redisUrl?: string): RedisMessageQueue {
  if (!redisQueue) {
    redisQueue = new RedisMessageQueue(redisUrl);
  }
  return redisQueue;
}

// Export lag detection components
export * from './lag-detector';

// Export RedisClient as an alias for RedisMessageQueue for backward compatibility
export { RedisMessageQueue as RedisClient };

export { RedisMessageQueue as default };