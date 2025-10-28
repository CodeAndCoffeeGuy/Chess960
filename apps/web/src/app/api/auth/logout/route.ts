import { NextRequest, NextResponse } from 'next/server';
import { getAuthService } from '@chess960/utils';
import { db } from '@chess960/db';

export async function POST(request: NextRequest) {
  try {
    const authService = getAuthService();
    
    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value;
    if (token) {
      // Verify token to get user ID
      const payload = authService.verifyAuthToken(token);
      
      if (payload) {
        // Invalidate sessions for authenticated users (not guests)
        if (payload.type === 'user') {
          await db.session.updateMany({
            where: { userId: payload.userId },
            data: { expires: new Date() }, // Set to past date to invalidate
          });
        }
      }
    }

    // Clear auth cookie (clear both httpOnly and non-httpOnly versions)
    const response = NextResponse.json({ success: true });
    
    // Clear httpOnly version
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
    
    // Clear non-httpOnly version
    response.cookies.set('auth-token', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}