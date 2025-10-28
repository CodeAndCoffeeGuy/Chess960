import { NextRequest, NextResponse } from 'next/server';
import { db } from '@chess960/db';
import { z } from 'zod';

const verifySchema = z.object({
  userId: z.string().uuid(),
  code: z.string().length(6),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, code } = verifySchema.parse(body);

    // Find user with verification token
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid verification request' }, { status: 400 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: 'Email already verified' }, { status: 400 });
    }

    if (!user.emailVerificationToken || !user.emailVerificationExpires) {
      return NextResponse.json({ error: 'No verification code found' }, { status: 400 });
    }

    // Check if code has expired
    if (new Date() > user.emailVerificationExpires) {
      return NextResponse.json({ error: 'Verification code expired' }, { status: 400 });
    }

    // Check if code matches
    if (user.emailVerificationToken !== code) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    // Mark email as verified
    await db.user.update({
      where: { id: userId },
      data: {
        emailVerified: new Date(),
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully!',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid verification data' },
        { status: 400 }
      );
    }

    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}