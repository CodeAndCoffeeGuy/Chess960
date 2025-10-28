import { NextResponse } from 'next/server';
import { prisma } from '@chess960/db';

export async function GET() {
  try {
    // Test database connection
    await prisma.$connect();
    const userCount = await prisma.user.count();

    return NextResponse.json({
      status: 'connected',
      userCount,
      database: process.env.DATABASE_URL ? 'SET' : 'MISSING',
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
      database: process.env.DATABASE_URL ? 'SET' : 'MISSING',
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
