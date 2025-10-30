import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { prisma } from '@chess960/db';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;
    
    // Fetch game data
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: {
        white: { select: { handle: true } },
        black: { select: { handle: true } },
        result: true,
        timeControl: true,
        createdAt: true,
      },
    });

    if (!game) {
      return new ImageResponse(
        (
          <div
            style={{
              height: '100%',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#1f1d1a',
              color: 'white',
              fontFamily: 'system-ui',
            }}
          >
            <div style={{ fontSize: 48, fontWeight: 'bold', marginBottom: 16 }}>
              Chess960 Game
            </div>
            <div style={{ fontSize: 24, color: '#a0958a' }}>
              Game not found
            </div>
          </div>
        ),
        {
          width: 1200,
          height: 630,
        }
      );
    }

    const whitePlayer = game.white?.handle || 'Anonymous';
    const blackPlayer = game.black?.handle || 'Anonymous';
    const result = game.result || 'Ongoing';
    const timeControl = game.timeControl || 'Unknown';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1f1d1a',
            color: 'white',
            fontFamily: 'system-ui',
            padding: 60,
          }}
        >
          {/* Header */}
          <div style={{ fontSize: 36, fontWeight: 'bold', marginBottom: 40, color: '#f97316' }}>
            Chess960 Game
          </div>
          
          {/* Game Info */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: 20,
            backgroundColor: '#2a2723',
            padding: 40,
            borderRadius: 16,
            border: '2px solid #474239',
            minWidth: 800,
          }}>
            {/* Players */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 40,
              fontSize: 32,
              fontWeight: 'bold',
            }}>
              <div style={{ color: '#f97316' }}>{whitePlayer}</div>
              <div style={{ fontSize: 24, color: '#a0958a' }}>vs</div>
              <div style={{ color: '#f97316' }}>{blackPlayer}</div>
            </div>
            
            {/* Result */}
            <div style={{ 
              fontSize: 28, 
              color: result === 'Ongoing' ? '#fbbf24' : '#10b981',
              fontWeight: 'bold',
            }}>
              {result}
            </div>
            
            {/* Time Control */}
            <div style={{ 
              fontSize: 20, 
              color: '#a0958a',
            }}>
              {timeControl}
            </div>
          </div>
          
          {/* Footer */}
          <div style={{ 
            position: 'absolute', 
            bottom: 40, 
            fontSize: 18, 
            color: '#6b6460' 
          }}>
            chess960.game
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error generating game OG image:', error);
    
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1f1d1a',
            color: 'white',
            fontFamily: 'system-ui',
          }}
        >
          <div style={{ fontSize: 48, fontWeight: 'bold', marginBottom: 16 }}>
            Chess960
          </div>
          <div style={{ fontSize: 24, color: '#a0958a' }}>
            Fischer Random Chess
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}
