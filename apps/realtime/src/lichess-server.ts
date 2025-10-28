import { Chess960WebSocketServer } from './lichess-websocket-server';
import express from 'express';
import cors from 'cors';

class Chess960Server {
  private wsServer: Chess960WebSocketServer;
  private httpServer: express.Application;
  private port: number;
  private healthPort: number;

  constructor(wsPort: number = 8080, healthPort: number = 8081) {
    this.port = wsPort;
    this.healthPort = healthPort;
    this.httpServer = express();
    
    this.setupHttpServer();
    this.wsServer = new Chess960WebSocketServer(wsPort);
    
    this.setupGracefulShutdown();
  }

  private setupHttpServer(): void {
    // CORS for health checks
    this.httpServer.use(cors({
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://chess960.game', 'https://www.chess960.game']
        : ['http://localhost:3000', 'http://localhost:3002'],
      credentials: true
    }));

    // Health check endpoint
    this.httpServer.get('/health', async (req, res) => {
      try {
        const health = await this.wsServer.getHealth();
        res.json({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          online: health.online,
          playing: health.playing,
          serverId: health.serverId
        });
      } catch (error) {
        res.status(500).json({
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    });

    // Stats endpoint
    this.httpServer.get('/stats', (req, res) => {
      try {
        const stats = this.wsServer.getStats();
        res.json(stats);
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Server info endpoint
    this.httpServer.get('/info', (req, res) => {
      res.json({
        server: 'Chess960 WebSocket Server',
        version: '1.0.0',
        features: [
          'Redis pub/sub messaging',
          'In-memory user tracking',
          'Horizontal scaling support',
          'Connection pooling',
          'Automatic cleanup'
        ],
        endpoints: {
          health: '/health',
          stats: '/stats',
          info: '/info'
        }
      });
    });

    // Start health server
    this.httpServer.listen(this.healthPort, () => {
      console.log(`[HEALTH] Health check server listening on port ${this.healthPort}`);
    });
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      console.log(`[SHUTDOWN] Received ${signal}, shutting down gracefully...`);
      
      try {
        await this.wsServer.shutdown();
        process.exit(0);
      } catch (error) {
        console.error('[SHUTDOWN] Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGUSR2', () => shutdown('SIGUSR2')); // For nodemon
  }

  // Get server stats
  getStats() {
    return {
      ...this.wsServer.getStats(),
      connectedClients: this.wsServer.getConnectedClientsCount(),
      serverPort: this.port,
      healthPort: this.healthPort
    };
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const wsPort = parseInt(process.env.WS_PORT || '8080');
  const healthPort = parseInt(process.env.HEALTH_PORT || '8081');
  
  console.log('[CHESS960-SERVER] Starting Chess960 WebSocket server...');
  console.log(`[CHESS960-SERVER] WebSocket port: ${wsPort}`);
  console.log(`[CHESS960-SERVER] Health port: ${healthPort}`);
  
  new Chess960Server(wsPort, healthPort);
}

export { Chess960Server };
