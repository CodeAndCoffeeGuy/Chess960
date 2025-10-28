import { NextResponse } from 'next/server';
import { getAuthService } from '@chess960/utils';
import { db } from '@chess960/db';

export async function GET() {
  return NextResponse.json({ 
    message: 'Guest auth endpoint is working',
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      hasJWT_SECRET: !!process.env.JWT_SECRET,
      hasDATABASE_URL: !!process.env.DATABASE_URL,
    }
  });
}

export async function POST() {
  console.log('Guest auth POST request received');
  console.log('Environment check:', {
    NODE_ENV: process.env.NODE_ENV,
    hasJWT_SECRET: !!process.env.JWT_SECRET,
    hasDATABASE_URL: !!process.env.DATABASE_URL,
  });
  
  try {
    const authService = getAuthService();
    
    // Generate guest token
    const token = authService.generateGuestToken();
    const payload = authService.verifyAuthToken(token);
    
    if (!payload) {
      console.error('Failed to verify generated guest token');
      return NextResponse.json({ error: 'Failed to create guest session' }, { status: 500 });
    }

    // Check if user already exists (in case of duplicate)
    const existingUser = await db.user.findUnique({
      where: { id: payload.userId },
    });

    if (existingUser) {
      console.log('Guest user already exists, skipping creation');
    } else {
      // Create user record in database with retry logic for handle conflicts
      let attempts = 0;
      let userCreated = false;
      
      while (!userCreated && attempts < 5) {
        try {
          await db.user.create({
            data: {
              id: payload.userId,
              handle: payload.handle + (attempts > 0 ? `_${attempts}` : ''),
              email: null,
            },
          });
          userCreated = true;
        } catch (error: any) {
          if (error.code === 'P2002' && error.meta?.target?.includes('handle')) {
            attempts++;
            console.log(`Handle conflict, retrying with attempt ${attempts}`);
          } else {
            throw error;
          }
        }
      }

      if (!userCreated) {
        console.error('Failed to create user after multiple attempts');
        return NextResponse.json({ error: 'Failed to create guest user' }, { status: 500 });
      }

      // Create initial ratings for common time controls
      await db.rating.createMany({
        data: [
          {
            userId: payload.userId,
            tc: '1+0', // Bullet
            rating: 1500,
            rd: 350,
            vol: 0.06,
          },
          {
            userId: payload.userId,
            tc: '3+0', // Blitz
            rating: 1500,
            rd: 350,
            vol: 0.06,
          },
          {
            userId: payload.userId,
            tc: '10+0', // Rapid
            rating: 1500,
            rd: 350,
            vol: 0.06,
          },
        ],
      });
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: payload.userId,
        handle: payload.handle,
        type: payload.type,
      },
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
    console.error('Guest authentication error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      cause: error instanceof Error ? error.cause : undefined,
    });
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}