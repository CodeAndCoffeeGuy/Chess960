import { NextRequest, NextResponse } from 'next/server';
import { getAuthService } from '@chess960/utils';
import { getEmailService } from '@chess960/utils/email';
import { db } from '@chess960/db';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email().min(1).max(255),
  password: z.string().min(8).max(100),
  handle: z.string().min(2).max(20).regex(/^[a-zA-Z0-9_-]+$/, "Handle can only contain letters, numbers, underscores, and hyphens"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, handle } = registerSchema.parse(body);

    const authService = getAuthService();

    // Check if user already exists
    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          { email: email },
          { handle: handle }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
      } else {
        return NextResponse.json({ error: 'Handle already taken' }, { status: 400 });
      }
    }

    // Hash password
    const hashedPassword = authService.hashPassword(password);

    // Generate email verification code
    const verificationCode = authService.generateEmailVerificationCode();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const user = await db.user.create({
      data: {
        email,
        handle,
        password: hashedPassword,
        emailVerified: null,
        emailVerificationToken: verificationCode,
        emailVerificationExpires: verificationExpires,
      },
    });

    // Create initial ratings for common time controls
    await db.rating.createMany({
      data: [
        {
          userId: user.id,
          tc: '1+0', // Bullet
          rating: 1500,
          rd: 350,
          vol: 0.06,
        },
        {
          userId: user.id,
          tc: '3+0', // Blitz
          rating: 1500,
          rd: 350,
          vol: 0.06,
        },
        {
          userId: user.id,
          tc: '10+0', // Rapid
          rating: 1500,
          rd: 350,
          vol: 0.06,
        },
      ],
    });

    // Send verification email
    const emailService = getEmailService();

    try {
      await emailService.sendVerificationEmail({
        to: email,
        verificationCode: verificationCode,
        expiresInHours: 24,
      });

      console.log(`Verification email sent to ${email}`);
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Don't fail registration if email fails - user can resend later
    }

    return NextResponse.json({
      success: true,
      message: 'Registration successful! Please check your email for verification code.',
      userId: user.id,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Registration error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack available');
    console.error('Error name:', error instanceof Error ? error.name : 'Unknown error type');
    console.error('Error message:', error instanceof Error ? error.message : String(error));

    return NextResponse.json(
      { error: 'Internal server error', debug: process.env.NODE_ENV === 'development' ? String(error) : undefined },
      { status: 500 }
    );
  }
}