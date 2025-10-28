import { NextResponse } from 'next/server';
import { prisma } from '@chess960/db';

export async function GET() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('Database connected');

    // Try to count users
    const userCount = await prisma.user.count();
    console.log('User count:', userCount);

    return NextResponse.json({
      success: true,
      userCount,
      message: 'Database connection successful'
    });
  } catch (error: any) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
