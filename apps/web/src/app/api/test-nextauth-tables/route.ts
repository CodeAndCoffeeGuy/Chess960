import { NextResponse } from 'next/server';
import { prisma } from '@chess960/db';

export async function GET() {
  try {
    // Check if NextAuth tables exist
    const accountCount = await prisma.account.count();
    const sessionCount = await prisma.session.count();
    const verificationTokenCount = await prisma.verificationToken.count();

    return NextResponse.json({
      status: 'success',
      tables: {
        accounts: accountCount,
        sessions: sessionCount,
        verificationTokens: verificationTokenCount,
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
    }, { status: 500 });
  }
}
