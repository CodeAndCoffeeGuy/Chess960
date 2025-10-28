import { NextRequest, NextResponse } from 'next/server';
import { getAuthService } from '@chess960/utils';
import { db } from '@chess960/db';
import { z } from 'zod';

const resendSchema = z.object({
  userId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = resendSchema.parse(body);

    const authService = getAuthService();

    // Find user
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: 'Email already verified' }, { status: 400 });
    }

    // Generate new verification code
    const verificationCode = authService.generateEmailVerificationCode();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with new verification code
    await db.user.update({
      where: { id: userId },
      data: {
        emailVerificationToken: verificationCode,
        emailVerificationExpires: verificationExpires,
      },
    });

    // For now, just log the verification code (in production, send email)
    console.log(`New Email Verification Code for ${user.email}: ${verificationCode}`);
    console.log(`Verification expires: ${verificationExpires.toISOString()}`);

    return NextResponse.json({
      success: true,
      message: 'Verification code sent! Please check your email.',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    console.error('Resend verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}