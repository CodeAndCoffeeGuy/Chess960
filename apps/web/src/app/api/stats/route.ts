import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  try {
    // In development, prioritize localhost server
    const isDevelopment = process.env.NODE_ENV === 'development';
    let response;
    
    if (isDevelopment) {
      // Try localhost first in development
      try {
        const localhostUrl = 'http://localhost:8081';
        response = await fetch(`${localhostUrl}/stats`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(3000)
        });
      } catch {
        // Fallback to production server
        const chess960Url = 'https://chess960-ws.fly.dev';
        response = await fetch(`${chess960Url}/stats`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(3000)
        });
      }
    } else {
      // In production, use production server
      const chess960Url = 'https://chess960-ws.fly.dev';
      response = await fetch(`${chess960Url}/stats`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(3000)
      });
    }
    
    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        playersOnline: data.playersOnline || 0,
        gamesInProgress: data.gamesInProgress || 0,
        timestamp: data.timestamp || new Date().toISOString(),
      });
    } else {
      return NextResponse.json({
        playersOnline: 0,
        gamesInProgress: 0,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.warn('Stats service unavailable:', error);
    return NextResponse.json({
      playersOnline: 0,
      gamesInProgress: 0,
      timestamp: new Date().toISOString(),
    });
  }
}
