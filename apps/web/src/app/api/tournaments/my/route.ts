import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@chess960/db';

// GET /api/tournaments/my - Get user's tournaments
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter'); // 'playing', 'created', 'all'

    let where: any = {};

    if (filter === 'playing') {
      // Tournaments user has joined
      where = {
        players: {
          some: {
            userId: session.user.id,
          },
        },
      };
    } else if (filter === 'created') {
      // Tournaments user created
      where = {
        createdBy: session.user.id,
      };
    } else {
      // All tournaments user is involved with
      where = {
        OR: [
          {
            players: {
              some: {
                userId: session.user.id,
              },
            },
          },
          {
            createdBy: session.user.id,
          },
        ],
      };
    }

    const tournaments = await prisma.tournament.findMany({
      where,
      include: {
        _count: {
          select: {
            players: true,
          },
        },
        players: {
          where: {
            userId: session.user.id,
          },
          select: {
            score: true,
            gamesPlayed: true,
            wins: true,
            losses: true,
            draws: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' },
        { startsAt: 'desc' },
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
        isCreator: t.createdBy === session.user.id,
        myStats: t.players[0] || null,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch my tournaments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tournaments' },
      { status: 500 }
    );
  }
}
