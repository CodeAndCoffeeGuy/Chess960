import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import jwt from 'jsonwebtoken';
import { OnlineUserManager } from './services/online-user-manager';
import { RedisPubSub } from './services/redis-pubsub';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  handle?: string;
  isAlive?: boolean;
  lastPing?: number;
}

interface WebSocketMessage {
  type: string;
  data?: any;
}

export class Chess960WebSocketServer {
  private wss: WebSocketServer;
  private onlineUserManager: OnlineUserManager;
  private redisPubSub: RedisPubSub;
  private serverId: string;
  private pingInterval: NodeJS.Timeout | null = null;
  private statsInterval: NodeJS.Timeout | null = null;

  constructor(port: number = 8080) {
    this.serverId = `server-${Date.now()}`;
    this.onlineUserManager = new OnlineUserManager(this.serverId);
    this.redisPubSub = new RedisPubSub();

    this.wss = new WebSocketServer({ 
      port,
      perMessageDeflate: false // Disable compression for better performance
    });

    this.setupWebSocketServer();
    this.startPingInterval();
    this.startStatsInterval();
    
    console.log(`[CHESS960-WS] WebSocket server listening on port ${port}`);
    console.log(`[CHESS960-WS] Server ID: ${this.serverId}`);
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: AuthenticatedWebSocket, req: IncomingMessage) => {
      console.log(`[CONN] New WebSocket connection from: ${req.headers.origin || 'unknown'}`);
      
      // Set up connection
      ws.isAlive = true;
      ws.lastPing = Date.now();

      // Handle messages
      ws.on('message', (data: Buffer) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          console.error('[MSG] Error parsing message:', error);
        }
      });

      // Handle pong responses
      ws.on('pong', () => {
        ws.isAlive = true;
        ws.lastPing = Date.now();
      });

      // Handle disconnection
      ws.on('close', () => {
        if (ws.userId) {
          this.onlineUserManager.disconnectUser(ws.userId);
          console.log(`[DISC] User ${ws.handle || ws.userId} disconnected`);
        }
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error('[WS-ERROR]', error);
        if (ws.userId) {
          this.onlineUserManager.disconnectUser(ws.userId);
        }
      });
    });

    // Handle server errors
    this.wss.on('error', (error) => {
      console.error('[WSS-ERROR]', error);
    });
  }

  private async handleMessage(ws: AuthenticatedWebSocket, message: WebSocketMessage): Promise<void> {
    switch (message.type) {
      case 'hello':
        await this.handleHello(ws, message.data);
        break;
      
      case 'ping':
        await this.handlePing(ws);
        break;
      
      case 'game:start':
        await this.handleGameStart(ws, message.data);
        break;
      
      case 'game:end':
        await this.handleGameEnd(ws, message.data);
        break;
      
      default:
        console.log(`[MSG] Unknown message type: ${message.type}`);
    }
  }

  private async handleHello(ws: AuthenticatedWebSocket, data: any): Promise<void> {
    try {
      const { sessionId } = data;
      
      if (!sessionId) {
        console.log('[HELLO] No session ID provided');
        return;
      }

      // Verify JWT token
      const decoded = jwt.verify(sessionId, process.env.NEXTAUTH_SECRET!) as any;
      
      if (!decoded.userId) {
        console.log('[HELLO] Invalid token - no userId');
        return;
      }

      // Authenticate user
      ws.userId = decoded.userId;
      ws.handle = decoded.handle || 'Anonymous';
      
      // Connect user to online system
      if (ws.userId) {
        await this.onlineUserManager.connectUser(ws.userId, ws.handle ?? 'Anonymous');
      }
      
      console.log(`[AUTH] User ${ws.handle} (${ws.userId}) authenticated`);
      
      // Send welcome message
      ws.send(JSON.stringify({
        type: 'welcome',
        data: {
          serverId: this.serverId,
          userId: ws.userId,
          handle: ws.handle
        }
      }));

    } catch (error) {
      console.error('[HELLO] Authentication failed:', error);
      ws.close(1008, 'Authentication failed');
    }
  }

  private async handlePing(ws: AuthenticatedWebSocket): Promise<void> {
    if (ws.userId) {
      this.onlineUserManager.updateUserActivity(ws.userId);
    }
    
    // Send pong response
    ws.send(JSON.stringify({ type: 'pong' }));
  }

  private async handleGameStart(ws: AuthenticatedWebSocket, data: any): Promise<void> {
    if (!ws.userId) return;
    
    const { gameId } = data;
    await this.onlineUserManager.setUserPlaying(ws.userId, gameId);
  }

  private async handleGameEnd(ws: AuthenticatedWebSocket, data: any): Promise<void> {
    if (!ws.userId) return;
    
    await this.onlineUserManager.setUserStoppedPlaying(ws.userId);
  }

  // Ping all connections to check if they're alive
  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      this.wss.clients.forEach((ws: AuthenticatedWebSocket) => {
        if (!ws.isAlive) {
          console.log('[CLEANUP] Terminating dead connection');
          if (ws.userId) {
            this.onlineUserManager.disconnectUser(ws.userId);
          }
          return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // Ping every 30 seconds
  }

  // Broadcast stats periodically
  private startStatsInterval(): void {
    this.statsInterval = setInterval(() => {
      const stats = this.onlineUserManager.getStats();
      
      // Broadcast stats to all connected clients
      this.wss.clients.forEach((ws: AuthenticatedWebSocket) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'stats',
            data: stats
          }));
        }
      });
    }, 5000); // Broadcast every 5 seconds
  }

  // Get current stats
  getStats() {
    return this.onlineUserManager.getStats();
  }

  // Get health status
  async getHealth() {
    return await this.onlineUserManager.healthCheck();
  }

  // Get connected clients count
  getConnectedClientsCount(): number {
    return this.wss.clients.size;
  }

  // Shutdown server
  async shutdown(): Promise<void> {
    console.log('[SHUTDOWN] Shutting down Chess960 WebSocket server...');
    
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
    }

    // Close all connections
    this.wss.clients.forEach((ws) => {
      ws.close(1001, 'Server shutting down');
    });

    // Close WebSocket server
    this.wss.close();
    
    // Shutdown online user manager
    await this.onlineUserManager.shutdown();
    
    console.log('[SHUTDOWN] Chess960 WebSocket server shut down');
  }
}
