import Redis from 'ioredis';

export interface OnlineUser {
  userId: string;
  handle: string;
  connectedAt: Date;
  lastSeen: Date;
}

export interface UserStatus {
  online: boolean;
  playing: boolean;
  streaming?: boolean;
  lag?: number;
}

export class RedisPubSub {
  private publisher: Redis;
  private subscriber: Redis;
  private onlineUsers: Map<string, OnlineUser> = new Map();
  private playingUsers: Set<string> = new Set();

  constructor() {
    // Publisher for sending messages
    this.publisher = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: 3,
    });

    // Subscriber for receiving messages
    this.subscriber = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: 3,
    });

    this.setupSubscriptions();
  }

  private setupSubscriptions() {
    // Subscribe to user connection events
    this.subscriber.subscribe('user:connect', 'user:disconnect', 'user:playing', 'user:stopped-playing');
    
    this.subscriber.on('message', (channel, message) => {
      try {
        const data = JSON.parse(message);
        this.handleMessage(channel, data);
      } catch (error) {
        console.error('[REDIS] Error parsing message:', error);
      }
    });

    this.subscriber.on('error', (error) => {
      console.error('[REDIS] Subscriber error:', error);
    });

    this.publisher.on('error', (error) => {
      console.error('[REDIS] Publisher error:', error);
    });
  }

  private handleMessage(channel: string, data: any) {
    switch (channel) {
      case 'user:connect':
        this.onlineUsers.set(data.userId, {
          userId: data.userId,
          handle: data.handle,
          connectedAt: new Date(data.connectedAt),
          lastSeen: new Date(data.connectedAt)
        });
        break;
      
      case 'user:disconnect':
        this.onlineUsers.delete(data.userId);
        this.playingUsers.delete(data.userId);
        break;
      
      case 'user:playing':
        this.playingUsers.add(data.userId);
        break;
      
      case 'user:stopped-playing':
        this.playingUsers.delete(data.userId);
        break;
    }
  }

  // Publish user connection
  async publishUserConnect(userId: string, handle: string) {
    await this.publisher.publish('user:connect', JSON.stringify({
      userId,
      handle,
      connectedAt: new Date().toISOString()
    }));
  }

  // Publish user disconnection
  async publishUserDisconnect(userId: string) {
    await this.publisher.publish('user:disconnect', JSON.stringify({
      userId,
      disconnectedAt: new Date().toISOString()
    }));
  }

  // Publish user playing status
  async publishUserPlaying(userId: string, gameId?: string) {
    await this.publisher.publish('user:playing', JSON.stringify({
      userId,
      gameId,
      startedAt: new Date().toISOString()
    }));
  }

  // Publish user stopped playing
  async publishUserStoppedPlaying(userId: string) {
    await this.publisher.publish('user:stopped-playing', JSON.stringify({
      userId,
      stoppedAt: new Date().toISOString()
    }));
  }

  // Get online users count
  getOnlineUsersCount(): number {
    return this.onlineUsers.size;
  }

  // Get playing users count
  getPlayingUsersCount(): number {
    return this.playingUsers.size;
  }

  // Get all online users
  getOnlineUsers(): OnlineUser[] {
    return Array.from(this.onlineUsers.values());
  }

  // Check if user is online
  isUserOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }

  // Check if user is playing
  isUserPlaying(userId: string): boolean {
    return this.playingUsers.has(userId);
  }

  // Get user status
  getUserStatus(userId: string): UserStatus {
    return {
      online: this.isUserOnline(userId),
      playing: this.isUserPlaying(userId)
    };
  }

  // Update user last seen
  updateUserLastSeen(userId: string) {
    const user = this.onlineUsers.get(userId);
    if (user) {
      user.lastSeen = new Date();
    }
  }

  // Clean up old connections (run periodically)
  cleanupOldConnections(maxAgeMinutes: number = 30) {
    const cutoff = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
    
    for (const [userId, user] of this.onlineUsers.entries()) {
      if (user.lastSeen < cutoff) {
        this.onlineUsers.delete(userId);
        this.playingUsers.delete(userId);
        console.log(`[CLEANUP] Removed stale connection for user: ${user.handle}`);
      }
    }
  }

  // Get stats for API
  getStats() {
    return {
      playersOnline: this.getOnlineUsersCount(),
      gamesInProgress: this.getPlayingUsersCount(),
      timestamp: new Date().toISOString()
    };
  }

  // Close connections
  async close() {
    await this.publisher.quit();
    await this.subscriber.quit();
  }
}
