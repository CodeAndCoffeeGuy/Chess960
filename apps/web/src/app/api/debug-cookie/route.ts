import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Create a simple test cookie
    const response = NextResponse.json({ 
      message: 'Test cookie set',
      timestamp: new Date().toISOString()
    });
    
    // Set a test cookie
    response.cookies.set('test-cookie', 'test-value', {
      httpOnly: false, // Allow client-side access
      secure: false,   // Allow non-HTTPS
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 24 hours
    });
    
    // Also set the auth-token cookie for testing
    response.cookies.set('auth-token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJndWVzdC10ZXN0IiwidHlwZSI6Imd1ZXN0IiwiaWF0IjoxNzM0NzQ4MDAwLCJleHAiOjE3MzQ4MzQ0MDB9.test-signature', {
      httpOnly: false, // Allow client-side access
      secure: false,   // Allow non-HTTPS
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 24 hours
    });
    
    return response;
  } catch (error) {
    console.error('Debug cookie error:', error);
    return NextResponse.json({ error: 'Failed to set test cookie' }, { status: 500 });
  }
}
