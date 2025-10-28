import { createClient, RedisClientType } from 'redis';

export class RedisClient {
  private client: RedisClientType;
  private connected = false;

  constructor(url?: string) {
    this.client = createClient({
      url: url || process.env.REDIS_URL || 'redis://localhost:6379',
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    this.client.on('connect', () => {
      console.log('Redis connected');
      this.connected = true;
    });

    this.client.on('disconnect', () => {
      console.log('Redis disconnected');
      this.connected = false;
    });
  }

  async connect(): Promise<void> {
    if (!this.connected) {
      await this.client.connect();
    }
  }

  async disconnect(): Promise<void> {
    if (this.connected) {
      await this.client.disconnect();
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  // Queue operations
  async addToQueue(queueKey: string, item: string, score: number): Promise<void> {
    await this.client.zAdd(queueKey, { score, value: item });
  }

  async removeFromQueue(queueKey: string, item: string): Promise<number> {
    return await this.client.zRem(queueKey, item);
  }

  async getQueueSize(queueKey: string): Promise<number> {
    return await this.client.zCard(queueKey);
  }

  async getQueueRange(queueKey: string, start = 0, end = -1): Promise<string[]> {
    return await this.client.zRange(queueKey, start, end);
  }

  async getQueueRangeWithScores(
    queueKey: string, 
    start = 0, 
    end = -1
  ): Promise<Array<{ value: string; score: number }>> {
    return await this.client.zRangeWithScores(queueKey, start, end);
  }

  // Hash operations (for storing user data in queue)
  async setHash(key: string, data: Record<string, string | number>): Promise<void> {
    await this.client.hSet(key, data);
  }

  async getHash(key: string): Promise<Record<string, string>> {
    return await this.client.hGetAll(key);
  }

  async deleteHash(key: string): Promise<number> {
    return await this.client.del(key);
  }

  // Set operations (for tracking active games)
  async addToSet(setKey: string, ...members: string[]): Promise<number> {
    return await this.client.sAdd(setKey, members);
  }

  async removeFromSet(setKey: string, ...members: string[]): Promise<number> {
    return await this.client.sRem(setKey, members);
  }

  async isSetMember(setKey: string, member: string): Promise<boolean> {
    return await this.client.sIsMember(setKey, member);
  }

  async getSetMembers(setKey: string): Promise<string[]> {
    return await this.client.sMembers(setKey);
  }

  // Expiration
  async expire(key: string, seconds: number): Promise<boolean> {
    return await this.client.expire(key, seconds);
  }

  // Pub/Sub for real-time updates
  async publish(channel: string, message: string): Promise<number> {
    return await this.client.publish(channel, message);
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    const subscriber = this.client.duplicate();
    await subscriber.connect();
    await subscriber.subscribe(channel, callback);
  }

  // Atomic operations
  async multi(): Promise<any> {
    return this.client.multi();
  }

  // Health check
  async ping(): Promise<string> {
    return await this.client.ping();
  }
}

// Singleton instance
let redisInstance: RedisClient | null = null;

export function getRedisClient(): RedisClient {
  if (!redisInstance) {
    redisInstance = new RedisClient();
  }
  return redisInstance;
}