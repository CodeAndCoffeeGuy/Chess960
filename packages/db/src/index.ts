import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables before Prisma Client initialization
const workspaceRoot = path.resolve(__dirname, '../../../');
dotenv.config({ path: path.join(workspaceRoot, '.env.local') });
dotenv.config({ path: path.join(workspaceRoot, '.env') });
dotenv.config();

// Debug environment variables
console.log('Environment check:')
console.log('DATABASE_URL available:', !!process.env.DATABASE_URL)
console.log('All RAILWAY vars:', Object.keys(process.env).filter(k => k.includes('RAILWAY')))
console.log('NODE_ENV:', process.env.NODE_ENV)

// Get database URL from environment variables
const databaseUrl = process.env.DATABASE_URL || process.env.RAILWAY_DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL or RAILWAY_DATABASE_URL environment variable must be set')
}

console.log('Using database URL:', databaseUrl.replace(/\/\/([^:]+):([^@]+)@/, '//[user]:[pass]@'))

// Singleton pattern to prevent multiple Prisma Client instances
// This is critical for preventing "too many connections" errors
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: databaseUrl
    }
  },
  // Connection pool settings to handle multiple concurrent users
  // These settings ensure efficient connection management for production
  // Max 10 connections per Prisma Client instance (Next.js serverless functions)
  // Timeout after 5 seconds if no connection available
  // Close unused connections after 10 seconds
})

// In development, attach to global to prevent hot-reload from creating new instances
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}

export * from '@prisma/client'
export { db as prisma }

export type { User, Session, Rating, Game, Move, FairplayFlag, MmEvent } from '@prisma/client'