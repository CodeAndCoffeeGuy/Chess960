import { NextRequest, NextResponse } from 'next/server';
import { getAuthService } from '@chess960/utils';
import { db } from '@chess960/db';
import { TimeControl } from '@chess960/proto';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/auth/error?reason=missing-token', request.url));
    }

    const authService = getAuthService();
    
    // Verify magic link token
    const magicLinkPayload = authService.verifyMagicLinkToken(token);
    if (!magicLinkPayload) {
      return NextResponse.redirect(new URL('/auth/error?reason=invalid-token', request.url));
    }

    const { email } = magicLinkPayload as { email: string };

    // Find or create user
    let user = await db.user.findUnique({
      where: { email },
      include: { ratings: true },
    });

    if (!user) {
      // Create new user
      const handle = generateHandleFromEmail(email);
      
      user = await db.user.create({
        data: {
          handle,
          email,
          ratings: {
            createMany: {
              data: [
                {
                  tc: 'ONE_PLUS_ZERO' as TimeControl,
                  rating: 1500,
                  rd: 350,
                  vol: 0.06,
                },
                {
                  tc: 'TWO_PLUS_ZERO' as TimeControl,
                  rating: 1500,
                  rd: 350,
                  vol: 0.06,
                },
              ],
            },
          },
        },
        include: { ratings: true },
      });
    }

    // Generate auth token
    const authToken = authService.generateAuthToken({
      userId: user.id,
      handle: user.handle || '',
      email: user.email || '',
      type: 'user',
    });

    // Create session record
    const sessionId = authService.generateSessionId();
    await db.session.create({
      data: {
        id: sessionId,
        sessionToken: sessionId,
        userId: user.id,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    // Redirect to success page with token
    const redirectUrl = new URL('/auth/success', request.url);
    const response = NextResponse.redirect(redirectUrl);

    // Set cookie accessible by JavaScript (needed for WebSocket auth)
    response.cookies.set('auth-token', authToken, {
      httpOnly: false, // Allow JavaScript access for WebSocket authentication
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Magic link verification error:', error);
    return NextResponse.redirect(new URL('/auth/error?reason=server-error', request.url));
  }
}

function generateHandleFromEmail(email: string): string {
  const username = email.split('@')[0];
  const cleanUsername = username.replace(/[^a-zA-Z0-9]/g, '');
  const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${cleanUsername}${randomSuffix}`.slice(0, 20);
}