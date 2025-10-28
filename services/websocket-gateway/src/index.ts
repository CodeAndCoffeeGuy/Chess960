import cluster from 'cluster';
import { cpus } from 'os';
import { WebSocketServer } from './server';
import { logger } from './utils/logger';
import { config } from './config';

const numCPUs = cpus().length;

if (cluster.isPrimary) {
  logger.info(`Starting WebSocket Gateway - Master process ${process.pid}`);
  logger.info(`Target: 100K+ concurrent players`);
  logger.info(`Spawning ${numCPUs} worker processes`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    logger.warn(`💀 Worker ${worker.process.pid} died (${signal || code}). Restarting...`);
    cluster.fork();
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('🛑 SIGTERM received, shutting down gracefully');
    for (const id in cluster.workers) {
      cluster.workers[id]?.kill();
    }
  });

} else {
  // Worker process
  const server = new WebSocketServer({
    port: config.WS_PORT,
    workerId: cluster.worker?.id || 1,
    redisUrl: config.REDIS_URL,
    jwtSecret: config.JWT_SECRET,
  });

  server.start().catch(error => {
    logger.error('💥 Failed to start worker:', error);
    process.exit(1);
  });

  // Graceful shutdown for worker
  process.on('SIGTERM', async () => {
    logger.info(`🛑 Worker ${process.pid} shutting down gracefully`);
    await server.stop();
    process.exit(0);
  });
}