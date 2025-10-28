import { RedisPubSub, OnlineUser, UserStatus } from './redis-pubsub';

export class OnlineUserManager {
  private redisPubSub: RedisPubSub;
  private serverId: string;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(serverId: string = 'server-1') {
    this.serverId = serverId;
    this.redisPubSub = new RedisPubSub();
    this.startCleanupInterval();
  }

  // User connection management
  async connectUser(userId: string, handle: string): Promise<void> {
    try {
      await this.redisPubSub.publishUserConnect(userId, handle);
      console.log(`[ONLINE] User ${handle} (${userId}) connected to ${this.serverId}`);
    } catch (error) {
      console.error(`[ONLINE] Failed to connect user ${handle}:`, error);
    }
  }

  async disconnectUser(userId: string): Promise<void> {
    try {
      await this.redisPubSub.publishUserDisconnect(userId);
      console.log(`[ONLINE] User ${userId} disconnected from ${this.serverId}`);
    } catch (error) {
      console.error(`[ONLINE] Failed to disconnect user ${userId}:`, error);
    }
  }

  // Game status management
  async setUserPlaying(userId: string, gameId?: string): Promise<void> {
    try {
      await this.redisPubSub.publishUserPlaying(userId, gameId);
      console.log(`[GAME] User ${userId} started playing game ${gameId || 'unknown'}`);
    } catch (error) {
      console.error(`[GAME] Failed to set user playing ${userId}:`, error);
    }
  }

  async setUserStoppedPlaying(userId: string): Promise<void> {
    try {
      await this.redisPubSub.publishUserStoppedPlaying(userId);
      console.log(`[GAME] User ${userId} stopped playing`);
    } catch (error) {
      console.error(`[GAME] Failed to set user stopped playing ${userId}:`, error);
    }
  }

  // Status queries
  isUserOnline(userId: string): boolean {
    return this.redisPubSub.isUserOnline(userId);
  }

  isUserPlaying(userId: string): boolean {
    return this.redisPubSub.isUserPlaying(userId);
  }

  getUserStatus(userId: string): UserStatus {
    return this.redisPubSub.getUserStatus(userId);
  }

  // Statistics
  getOnlineCount(): number {
    return this.redisPubSub.getOnlineUsersCount();
  }

  getPlayingCount(): number {
    return this.redisPubSub.getPlayingUsersCount();
  }

  getStats() {
    return this.redisPubSub.getStats();
  }

  // Update user activity (ping)
  updateUserActivity(userId: string): void {
    this.redisPubSub.updateUserLastSeen(userId);
  }

  // Get all online users
  getOnlineUsers(): OnlineUser[] {
    return this.redisPubSub.getOnlineUsers();
  }

  // Cleanup management
  private startCleanupInterval(): void {
    // Clean up stale connections every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.redisPubSub.cleanupOldConnections(30); // 30 minutes max age
    }, 5 * 60 * 1000);
  }

  // Health check
  async healthCheck(): Promise<{ status: string; online: number; playing: number; serverId: string }> {
    return {
      status: 'healthy',
      online: this.getOnlineCount(),
      playing: this.getPlayingCount(),
      serverId: this.serverId
    };
  }

  // Cleanup on shutdown
  async shutdown(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    await this.redisPubSub.close();
    console.log(`[SHUTDOWN] OnlineUserManager for ${this.serverId} shut down`);
  }
}
