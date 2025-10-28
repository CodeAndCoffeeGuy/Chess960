import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@chess960/db';
import { broadcastNotificationToUser } from '@/lib/notification-broadcast';

// GET /api/tournaments - List all tournaments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'UPCOMING', 'LIVE', 'FINISHED'

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const tournaments = await prisma.tournament.findMany({
      where,
      include: {
        _count: {
          select: {
            players: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // UPCOMING first, then LIVE, then FINISHED
        { startsAt: 'asc' },
      ],
      take: 50,
    });

    return NextResponse.json({
      tournaments: tournaments.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        status: t.status,
        tc: t.tc,
        startsAt: t.startsAt.toISOString(),
        duration: t.duration,
        endsAt: t.endsAt?.toISOString(),
        maxPlayers: t.maxPlayers,
        minRating: t.minRating,
        maxRating: t.maxRating,
        playerCount: t._count.players,
        createdBy: t.createdBy,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch tournaments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tournaments' },
      { status: 500 }
    );
  }
}

// POST /api/tournaments - Create a new tournament
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      startsAt,
      clockTime = 2,
      clockIncrement = 0,
    } = body;

    // Generate tc string from clockTime and clockIncrement
    const tc = `${clockTime}+${clockIncrement}`;

    // Parse numeric fields
    const duration = body.duration ? parseInt(body.duration, 10) : null;
    const maxPlayers = body.maxPlayers ? parseInt(body.maxPlayers, 10) : null;
    const minRating = body.minRating ? parseInt(body.minRating, 10) : null;
    const maxRating = body.maxRating ? parseInt(body.maxRating, 10) : null;

    // Validation
    if (!name || !startsAt || !duration) {
      return NextResponse.json(
        { error: 'Missing required fields: name, startsAt, duration' },
        { status: 400 }
      );
    }

    if (isNaN(duration) || duration < 10 || duration > 360) {
      return NextResponse.json(
        { error: 'Duration must be between 10 and 360 minutes' },
        { status: 400 }
      );
    }

    const startDate = new Date(startsAt);
    if (startDate <= new Date()) {
      return NextResponse.json(
        { error: 'Tournament must start in the future' },
        { status: 400 }
      );
    }

    const tournament = await prisma.tournament.create({
      data: {
        name,
        description: description || null,
        startsAt: startDate,
        duration,
        tc,
        maxPlayers: maxPlayers || undefined,
        minRating: minRating || undefined,
        maxRating: maxRating || undefined,
        createdBy: session.user.id,
      },
    });

    // Check if creator wants tournament notifications
    const creatorSettings = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { tournamentNotifications: true },
    });

    // Create system notification for tournament creation only if they want tournament notifications
    if (creatorSettings?.tournamentNotifications !== false) {
      const notification = await prisma.notification.create({
        data: {
          userId: session.user.id,
          type: 'TOURNAMENT',
          title: 'Tournament Created',
          message: `Your tournament "${name}" has been created and will start at ${startDate.toLocaleString()}`,
          tournamentId: tournament.id,
          link: '/tournaments',
        },
      });

      // Broadcast notification in real-time
      await broadcastNotificationToUser(session.user.id, notification.id);
    }

    return NextResponse.json({
      tournament: {
        id: tournament.id,
        name: tournament.name,
        description: tournament.description,
        status: tournament.status,
        tc: tournament.tc,
        startsAt: tournament.startsAt.toISOString(),
        duration: tournament.duration,
        maxPlayers: tournament.maxPlayers,
        minRating: tournament.minRating,
        maxRating: tournament.maxRating,
      },
    });
  } catch (error) {
    console.error('Failed to create tournament:', error);
    return NextResponse.json(
      { error: 'Failed to create tournament' },
      { status: 500 }
    );
  }
}
