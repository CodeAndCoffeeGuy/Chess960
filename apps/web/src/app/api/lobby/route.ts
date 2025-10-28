import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@chess960/db';

// GET /api/lobby - List all lobbies
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const speed = searchParams.get('speed');
    const rated = searchParams.get('rated');

    // Build where clause
    const where: any = {};

    // Filter by time control / speed
    if (speed) {
      const timeControls = {
        bullet: ['1+0', '2+1'],
        blitz: ['3+0', '3+2', '5+0', '5+3'],
        rapid: ['10+0', '10+5', '15+0', '15+10'],
        classical: ['30+0', '30+20'],
      };
      const tcs = timeControls[speed as keyof typeof timeControls] || [];
      if (tcs.length > 0) {
        where.timeControl = { in: tcs };
      }
    }

    // Filter by rated/casual
    if (rated !== null && rated !== undefined) {
      where.rated = rated === 'true';
    }

    const lobbies = await prisma.lobby.findMany({
      where,
      include: {
        host: {
          select: {
            id: true,
            handle: true,
            ratings: {
              where: {
                tc: '1+0', // Use 1+0 bullet rating as default
                variant: 'CHESS960',
              },
              select: {
                rating: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format lobbies for response
    const formattedLobbies = lobbies.map((lobby) => {
      const hostRating = lobby.host.ratings[0]?.rating || 1500;
      const [mins] = lobby.timeControl.split('+').map(Number);
      let speed: string;
      if (mins < 3) speed = 'bullet';
      else if (mins < 10) speed = 'blitz';
      else if (mins < 30) speed = 'rapid';
      else speed = 'classical';

      return {
        id: lobby.id,
        hostId: lobby.hostId,
        hostHandle: lobby.host.handle || 'Anonymous',
        hostRating,
        timeControl: lobby.timeControl,
        rated: lobby.rated,
        minRating: lobby.minRating,
        maxRating: lobby.maxRating,
        speed,
        createdAt: lobby.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ lobbies: formattedLobbies });
  } catch (error) {
    console.error('Failed to fetch lobbies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lobbies' },
      { status: 500 }
    );
  }
}

// POST /api/lobby - Create a new lobby
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { timeControl, rated = true, minRating = 0, maxRating = 3000 } = body;

    if (!timeControl) {
      return NextResponse.json(
        { error: 'Time control is required' },
        { status: 400 }
      );
    }

    // Check if user already has an active lobby
    const existingLobby = await prisma.lobby.findFirst({
      where: {
        hostId: (session.user as any).id,
      },
    });

    if (existingLobby) {
      return NextResponse.json(
        { error: 'You already have an active lobby' },
        { status: 400 }
      );
    }

    // Create the lobby
    const lobby = await prisma.lobby.create({
      data: {
        hostId: (session.user as any).id,
        timeControl,
        rated,
        minRating,
        maxRating,
      },
      include: {
        host: {
          select: {
            id: true,
            handle: true,
          },
        },
      },
    });

    return NextResponse.json({ lobby }, { status: 201 });
  } catch (error) {
    console.error('Failed to create lobby:', error);
    return NextResponse.json(
      { error: 'Failed to create lobby' },
      { status: 500 }
    );
  }
}
