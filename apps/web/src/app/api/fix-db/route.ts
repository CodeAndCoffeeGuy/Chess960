import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@chess960/db';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting database fix...');
    
    // Create accounts table
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
    console.log('Created accounts table');

    // Create sessions table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        session_token TEXT UNIQUE NOT NULL,
        user_id TEXT NOT NULL,
        expires TIMESTAMP NOT NULL
      );
    `;
    console.log('Created sessions table');

    // Create verification_tokens table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS verification_tokens (
        identifier TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expires TIMESTAMP NOT NULL,
        UNIQUE(identifier, token)
      );
    `;
    console.log('Created verification_tokens table');

    // Add handle_changed_at column to users table if it doesn't exist
    try {
      await prisma.$executeRaw`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS handle_changed_at TIMESTAMP;
      `;
      console.log('Added handle_changed_at column to users table');
    } catch (error) {
      console.log('handle_changed_at column might already exist:', error);
    }

    // Convert UUID columns to TEXT if they exist
    try {
      await prisma.$executeRaw`
        ALTER TABLE accounts ALTER COLUMN id TYPE TEXT;
      `;
      console.log('Converted accounts.id to TEXT');
    } catch (error) {
      console.log('accounts.id might already be TEXT:', error);
    }

    try {
      await prisma.$executeRaw`
        ALTER TABLE accounts ALTER COLUMN user_id TYPE TEXT;
      `;
      console.log('Converted accounts.user_id to TEXT');
    } catch (error) {
      console.log('accounts.user_id might already be TEXT:', error);
    }

    try {
      await prisma.$executeRaw`
        ALTER TABLE sessions ALTER COLUMN id TYPE TEXT;
      `;
      console.log('Converted sessions.id to TEXT');
    } catch (error) {
      console.log('sessions.id might already be TEXT:', error);
    }

    try {
      await prisma.$executeRaw`
        ALTER TABLE sessions ALTER COLUMN user_id TYPE TEXT;
      `;
      console.log('Converted sessions.user_id to TEXT');
    } catch (error) {
      console.log('sessions.user_id might already be TEXT:', error);
    }

    console.log('Database fix completed successfully');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database fixed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database fix failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}