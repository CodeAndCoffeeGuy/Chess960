import WebSocket, { WebSocketServer as WSServer } from 'ws';
import { createServer } from 'http';
import Redis from 'ioredis';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './utils/logger';
import { ConnectionManager } from './managers/ConnectionManager';
import { MessageHandler } from './handlers/MessageHandler';
import { HealthCheck } from './utils/health';
import { Metrics } from './utils/metrics';
import { RateLimiter } from './utils/rateLimiter';

interface ServerConfig {
  port: number;
  workerId: number;
  redisUrl: string;
  jwtSecret: string;
}

export class WebSocketServer {
  private server: WSServer;
  private httpServer: any;
  private redis: Redis;
  private pubRedis: Redis;
  private subRedis: Redis;
  private connectionManager: ConnectionManager;
  private messageHandler: MessageHandler;
  private healthCheck: HealthCheck;
  private metrics: Metrics;
  private rateLimiter: RateLimiter;
  private config: ServerConfig;

  constructor(config: ServerConfig) {
    this.config = config;
    this.setupRedis();
    this.setupServer();
    this.setupComponents();
  }

  private setupRedis(): void {
    // Main Redis connection
    this.redis = new Redis(this.config.redisUrl, {
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });

    // Separate connections for pub/sub
    this.pubRedis = new Redis(this.config.redisUrl);
    this.subRedis = new Redis(this.config.redisUrl);

    // Redis error handling
    this.redis.on('error', (err) => logger.error('Redis error:', err));
    this.pubRedis.on('error', (err) => logger.error('Pub Redis error:', err));
    this.subRedis.on('error', (err) => logger.error('Sub Redis error:', err));
  }

  private setupServer(): void {
    this.httpServer = createServer();
    this.server = new WSServer({
      server: this.httpServer,
      perMessageDeflate: {
        zlibDeflateOptions: {
          threshold: 1024,
          concurrencyLimit: 10,
        },
      },
      maxPayload: 64 * 1024, // 64KB max message size
    });
  }

  private setupComponents(): void {
    this.connectionManager = new ConnectionManager(this.redis, this.config.workerId);
    this.messageHandler = new MessageHandler(this.pubRedis, this.config.jwtSecret);
    this.healthCheck = new HealthCheck(this.redis);
    this.metrics = new Metrics();
    this.rateLimiter = new RateLimiter(this.redis);
  }

  async start(): Promise<void> {
    await this.redis.connect();
    await this.pubRedis.connect();
    await this.subRedis.connect();

    // Setup WebSocket connection handling
    this.server.on('connection', this.handleConnection.bind(this));

    // Setup Redis subscriptions
    await this.setupRedisSubscriptions();

    // Setup health check endpoint
    this.httpServer.on('request', this.healthCheck.handler.bind(this.healthCheck));

    // Start HTTP server
    this.httpServer.listen(this.config.port, () => {
      logger.info(`🌐 WebSocket Gateway Worker ${this.config.workerId} listening on port ${this.config.port}`);
      logger.info(`📈 Ready to handle 10K+ concurrent connections per worker`);
    });

    // Setup metrics collection
    this.startMetricsCollection();
  }

  private async handleConnection(ws: WebSocket, request: any): Promise<void> {
    const connectionId = uuidv4();
    const ip = request.socket.remoteAddress;

    // Rate limiting
    const rateLimitResult = await this.rateLimiter.checkConnection(ip);
    if (!rateLimitResult.allowed) {
      logger.warn(`🚫 Rate limit exceeded for IP ${ip}`);
      ws.close(1008, 'Rate limit exceeded');
      return;
    }

    logger.debug(`🔌 New connection: ${connectionId} from ${ip}`);
    this.metrics.incrementConnections();

    // Add to connection manager
    await this.connectionManager.addConnection(connectionId, ws, ip);

    // Handle messages
    ws.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        await this.messageHandler.handle(connectionId, message, ws);
      } catch (error) {
        logger.error(`💥 Message handling error for ${connectionId}:`, error);
        ws.close(1003, 'Invalid message format');
      }
    });

    // Handle disconnection
    ws.on('close', async (code: number, reason: Buffer) => {
      logger.debug(`🔌 Connection closed: ${connectionId} (${code}: ${reason.toString()})`);
      await this.connectionManager.removeConnection(connectionId);
      this.metrics.decrementConnections();
    });

    // Handle errors
    ws.on('error', (error: Error) => {
      logger.error(`💥 WebSocket error for ${connectionId}:`, error);
      this.connectionManager.removeConnection(connectionId);
      this.metrics.decrementConnections();
    });

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      connectionId,
      workerId: this.config.workerId,
      timestamp: Date.now(),
    }));
  }

  private async setupRedisSubscriptions(): Promise<void> {
    // Subscribe to global broadcasts
    await this.subRedis.subscribe('global:broadcast');

    // Subscribe to worker-specific messages
    await this.subRedis.subscribe(`worker:${this.config.workerId}`);

    // Subscribe to game-specific channels (pattern subscription)
    await this.subRedis.psubscribe('game:*');
    await this.subRedis.psubscribe('user:*');

    this.subRedis.on('message', this.handleRedisMessage.bind(this));
    this.subRedis.on('pmessage', this.handleRedisPatternMessage.bind(this));
  }

  private async handleRedisMessage(channel: string, message: string): Promise<void> {
    try {
      const data = JSON.parse(message);

      switch (channel) {
        case 'global:broadcast':
          await this.connectionManager.broadcastToAll(data);
          break;
        case `worker:${this.config.workerId}`:
          await this.connectionManager.sendToConnection(data.connectionId, data.message);
          break;
      }
    } catch (error) {
      logger.error('💥 Redis message handling error:', error);
    }
  }

  private async handleRedisPatternMessage(pattern: string, channel: string, message: string): Promise<void> {
    try {
      const data = JSON.parse(message);

      if (pattern === 'game:*') {
        const gameId = channel.split(':')[1];
        await this.connectionManager.broadcastToGame(gameId, data);
      } else if (pattern === 'user:*') {
        const userId = channel.split(':')[1];
        await this.connectionManager.sendToUser(userId, data);
      }
    } catch (error) {
      logger.error('💥 Redis pattern message handling error:', error);
    }
  }

  private startMetricsCollection(): void {
    // Collect metrics every 10 seconds
    setInterval(async () => {
      const stats = await this.connectionManager.getStats();
      this.metrics.updateConnectionStats(stats);

      // Send metrics to Redis for aggregation
      await this.redis.hset(`metrics:worker:${this.config.workerId}`, {
        connections: stats.activeConnections,
        messages_per_second: stats.messagesPerSecond,
        memory_usage: process.memoryUsage().heapUsed,
        uptime: process.uptime(),
        timestamp: Date.now(),
      });
    }, 10000);
  }

  async stop(): Promise<void> {
    logger.info(`🛑 Stopping WebSocket Gateway Worker ${this.config.workerId}`);

    // Close all connections gracefully
    await this.connectionManager.closeAllConnections();

    // Close servers
    this.server.close();
    this.httpServer.close();

    // Disconnect Redis
    await this.redis.disconnect();
    await this.pubRedis.disconnect();
    await this.subRedis.disconnect();

    logger.info(`Worker ${this.config.workerId} stopped gracefully`);
  }
}