import { NextRequest, NextResponse } from 'next/server';
import { getAuthService } from '@chess960/utils';

export async function GET(request: NextRequest) {
  try {
    // Get auth token from cookie
    const authToken = request.cookies.get('auth-token')?.value;
    
    if (!authToken) {
      return NextResponse.json({ error: 'No auth token found' }, { status: 401 });
    }

    // Verify token
    const authService = getAuthService();
    const payload = authService.verifyAuthToken(authToken);
    
    if (!payload || payload.type !== 'guest') {
      return NextResponse.json({ error: 'Invalid guest token' }, { status: 401 });
    }

    // Import guest rating manager
    const { guestRatingManager } = await import('@chess960/realtime/src/services/guest-rating-manager');
    
    // Get guest data (now async)
    const guestData = await guestRatingManager.getGuestData(payload.userId);
    
    // Convert Map to object for JSON serialization
    const ratings = Object.fromEntries(guestData.ratings);
    
    return NextResponse.json({
      success: true,
      user: {
        id: payload.userId,
        handle: payload.handle,
        type: payload.type,
      },
      ratings,
      stats: guestData.stats,
      games: guestData.games,
    });

  } catch (error) {
    console.error('Guest data fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch guest data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
