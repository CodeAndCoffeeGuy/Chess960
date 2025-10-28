import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables before importing services
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootEnvPath = path.resolve(__dirname, '../../../.env.local');
console.log('Loading env from:', rootEnvPath);
dotenv.config({ path: rootEnvPath });

// Override with local development settings
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_PDarGg6v3bfn@ep-ancient-heart-a2lqb2ul-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
process.env.NODE_ENV = 'development';

import { SimpleRealtimeServer } from './simple-server';

// Debug environment variables  
console.log('Realtime Server Environment check:');
console.log('DATABASE_URL available:', process.env.DATABASE_URL ? 'true' : 'false');
console.log('PORT:', process.env.PORT || 'not set');
console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('RAILWAY vars:', Object.keys(process.env).filter(k => k.includes('RAILWAY')));
console.log('Starting Simple Realtime Server...');

const PORT = parseInt(process.env.PORT || '8080', 10);

const server = new SimpleRealtimeServer(PORT);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  server.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.stop();
  process.exit(0);
});

// Start server
server.start();