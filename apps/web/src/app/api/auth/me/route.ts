import { NextRequest, NextResponse } from 'next/server';
import { getAuthService } from '@chess960/utils';
import { db } from '@chess960/db';

export async function GET(request: NextRequest) {
  try {
    const authService = getAuthService();
    
    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value;
    console.log('/api/auth/me - Token check:', token ? 'FOUND' : 'NOT_FOUND');
    if (!token) {
      console.log('/api/auth/me - No token found, returning 401');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify token
    const payload = authService.verifyAuthToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Handle guest users (don't exist in database)
    if (payload.type === 'guest') {
      console.log('/api/auth/me - Guest user detected, returning token-based info');
      return NextResponse.json({
        user: {
          id: payload.userId,
          handle: payload.handle,
          email: null,
          type: 'guest',
          createdAt: new Date(),
          totalGames: 0,
          ratings: {
            '1+0': { tc: '1+0', rating: 1500, rd: 350, vol: 0.06, updatedAt: new Date() },
            '2+0': { tc: '2+0', rating: 1500, rd: 350, vol: 0.06, updatedAt: new Date() }
          },
        },
      });
    }

    // Get user with ratings (for registered users)
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      include: {
        ratings: true,
        _count: {
          select: {
            whiteGames: true,
            blackGames: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Format ratings by time control
    const ratingsByTc = user.ratings.reduce((acc, rating) => {
      const tcKey = rating.tc === 'ONE_PLUS_ZERO' ? '1+0' : '2+0';
      acc[tcKey] = {
        tc: tcKey,
        rating: Number(rating.rating),
        rd: Number(rating.rd),
        vol: Number(rating.vol),
        updatedAt: rating.updatedAt,
      };
      return acc;
    }, {} as Record<string, {
      tc: string;
      rating: number;
      rd: number;
      vol: number;
      updatedAt: Date;
    }>);

    return NextResponse.json({
      user: {
        id: user.id,
        handle: user.handle,
        email: user.email,
        type: payload.type,
        createdAt: user.createdAt,
        totalGames: user._count.whiteGames + user._count.blackGames,
        ratings: ratingsByTc,
      },
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}