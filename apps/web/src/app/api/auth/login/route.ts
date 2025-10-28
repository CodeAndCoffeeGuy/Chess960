import { NextRequest, NextResponse } from 'next/server';
import { getAuthService } from '@chess960/utils';
import { db } from '@chess960/db';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    const authService = getAuthService();

    // Find user by email
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Verify password
    const isValidPassword = authService.verifyPassword(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return NextResponse.json({
        error: 'Email not verified',
        requiresVerification: true,
        userId: user.id
      }, { status: 403 });
    }

    // Generate auth token
    const token = authService.generateAuthToken({
      userId: user.id,
      handle: user.handle || '',
      email: user.email || '',
      type: 'user',
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        handle: user.handle,
        email: user.email,
        emailVerified: user.emailVerified,
      },
    });

    // Set auth cookie
    response.cookies.set('auth-token', token, {
      httpOnly: false, // Allow JavaScript access for WebSocket auth
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return response;

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 400 }
      );
    }

    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}