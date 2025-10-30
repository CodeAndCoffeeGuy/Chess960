import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { prisma } from '@chess960/db';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    const { handle } = await params;
    
    // Fetch user data
    const user = await prisma.user.findUnique({
      where: { handle },
      select: {
        handle: true,
        fullName: true,
        country: true,
        ratings: {
          select: {
            tc: true,
            rating: true,
          },
          orderBy: { rating: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            gamesAsWhite: true,
            gamesAsBlack: true,
          },
        },
      },
    });

    if (!user) {
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
              Chess960 Profile
            </div>
            <div style={{ fontSize: 24, color: '#a0958a' }}>
              Player not found
            </div>
          </div>
        ),
        {
          width: 1200,
          height: 630,
        }
      );
    }

    const topRating = user.ratings[0]?.rating || 1500;
    const gamesPlayed = user._count.gamesAsWhite + user._count.gamesAsBlack;
    const displayName = user.fullName || user.handle;

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
            Chess960 Profile
          </div>
          
          {/* Profile Info */}
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
            {/* Player Name */}
            <div style={{ 
              fontSize: 40,
              fontWeight: 'bold',
              color: '#f97316',
            }}>
              {displayName}
            </div>
            
            {/* Handle */}
            <div style={{ 
              fontSize: 24, 
              color: '#a0958a',
            }}>
              @{user.handle}
            </div>
            
            {/* Stats */}
            <div style={{ 
              display: 'flex', 
              gap: 40,
              marginTop: 20,
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, fontWeight: 'bold', color: '#f97316' }}>
                  {topRating}
                </div>
                <div style={{ fontSize: 16, color: '#a0958a' }}>
                  Rating
                </div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, fontWeight: 'bold', color: '#f97316' }}>
                  {gamesPlayed}
                </div>
                <div style={{ fontSize: 16, color: '#a0958a' }}>
                  Games
                </div>
              </div>
            </div>
            
            {/* Country */}
            {user.country && (
              <div style={{ 
                fontSize: 18, 
                color: '#a0958a',
                marginTop: 10,
              }}>
                {user.country}
              </div>
            )}
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
    console.error('Error generating profile OG image:', error);
    
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
