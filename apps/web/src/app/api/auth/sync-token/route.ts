import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../[...nextauth]/route';
import { getAuthService } from '@chess960/utils';
import { prisma } from '@chess960/db';

export async function POST(_request: NextRequest) {
  try {
    console.log('[SYNC-TOKEN] Sync token request received');

    // Get NextAuth session
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      console.log('[SYNC-TOKEN] No session found, returning 401');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('[SYNC-TOKEN] Found NextAuth session for user ID:', (session.user as any).id);

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: { id: true, handle: true, email: true },
    });

    if (!user || !user.handle) {
      console.log('[SYNC-TOKEN] User not found or missing handle');
      return NextResponse.json({ error: 'User not found or missing handle' }, { status: 404 });
    }

    console.log('[SYNC-TOKEN] Found user in database:', user.handle);

    // Generate JWT auth token
    const authService = getAuthService();
    const token = authService.generateAuthToken({
      userId: user.id,
      handle: user.handle,
      email: user.email || undefined,
      type: 'user',
    });

    console.log('[SYNC-TOKEN] Generated JWT token (first 30 chars):', token.substring(0, 30) + '...');
    console.log('[SYNC-TOKEN] Token length:', token.length);

    const response = NextResponse.json({ token, handle: user.handle });

    // Set cookie accessible by JavaScript (needed for WebSocket auth)
    const cookieOptions = {
      httpOnly: false, // Allow JavaScript access for WebSocket authentication
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    };

    console.log('[SYNC-TOKEN] Setting auth-token cookie with options:', cookieOptions);
    response.cookies.set('auth-token', token, cookieOptions);
    console.log('[SYNC-TOKEN] Cookie set successfully for user:', user.handle);

    return response;
  } catch (error) {
    console.error('Token sync error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
