// Simple script to fix production database
// Run this with: node scripts/fix-db-simple.js

const { PrismaClient } = require('@prisma/client');

async function fixDatabase() {
  const prisma = new PrismaClient();

  try {
    console.log('🔧 Fixing production database...');

    // Create NextAuth tables
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        provider TEXT NOT NULL,
        provider_account_id TEXT NOT NULL,
        refresh_token TEXT,
        access_token TEXT,
        expires_at INTEGER,
        token_type TEXT,
        scope TEXT,
        id_token TEXT,
        session_state TEXT,
        UNIQUE(provider, provider_account_id)
      );
    `;

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        session_token TEXT UNIQUE NOT NULL,
        user_id TEXT NOT NULL,
        expires TIMESTAMP NOT NULL
      );
    `;

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS verification_tokens (
        identifier TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expires TIMESTAMP NOT NULL,
        UNIQUE(identifier, token)
      );
    `;

    // Add missing column
    await prisma.$executeRaw`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS handle_changed_at TIMESTAMP;
    `;

    console.log('✅ Database fixed successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDatabase();
