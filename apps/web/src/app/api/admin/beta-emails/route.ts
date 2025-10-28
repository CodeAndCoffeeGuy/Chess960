import { NextRequest, NextResponse } from 'next/server';
import { db } from '@chess960/db';

export async function GET(_request: NextRequest) {
  try {
    // Temporarily allow access without authentication for beta testing
    // TODO: Re-enable authentication after initial setup
    // if (process.env.NODE_ENV === 'production') {
    //   const authHeader = request.headers.get('authorization');
    //   if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
    //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    //   }
    // }

    // Get all beta emails
    const betaEmails = await db.betaEmail.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      emails: betaEmails,
      count: betaEmails.length,
      notified: betaEmails.filter(e => e.isNotified).length,
      pending: betaEmails.filter(e => !e.isNotified).length
    });

  } catch (error) {
    console.error('Beta emails fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch beta emails' },
      { status: 500 }
    );
  }
}
