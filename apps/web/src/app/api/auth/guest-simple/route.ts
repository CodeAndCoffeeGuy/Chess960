import { NextResponse } from 'next/server';
import { getAuthService } from '@chess960/utils';

export async function POST() {
  try {
    console.log('Simple guest auth POST request received');
    
    const authService = getAuthService();
    
    // Generate guest token
    const token = authService.generateGuestToken();
    console.log('[DEBUG] Generated guest token:', token?.substring(0, 50) + '...');
    console.log('[DEBUG] Token length:', token?.length);
    
    const payload = authService.verifyAuthToken(token);
    console.log('[DEBUG] Verified payload:', payload);
    
    if (!payload) {
      console.error('Failed to verify generated guest token');
      return NextResponse.json({ error: 'Failed to create guest session' }, { status: 500 });
    }

    // Skip database operations for now and just return the token
    const response = NextResponse.json({
      success: true,
      user: {
        id: payload.userId,
        handle: payload.handle,
        type: payload.type,
      },
      note: 'Database operations skipped - using token-only authentication'
    });

    // Set cookie accessible by JavaScript (needed for WebSocket auth)
    response.cookies.set('auth-token', token, {
      httpOnly: false, // Allow JavaScript access for WebSocket authentication
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Simple guest authentication error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Simple guest auth endpoint is working',
    timestamp: new Date().toISOString()
  });
}