import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@chess960/db';

// POST /api/tournaments/[id]/join - Join a tournament
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            players: true,
          },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Check if tournament is still upcoming
    if (tournament.status !== 'UPCOMING') {
      return NextResponse.json(
        { error: 'Tournament has already started or finished' },
        { status: 400 }
      );
    }

    // Check if already joined
    const existingPlayer = await prisma.tournamentPlayer.findUnique({
      where: {
        tournamentId_userId: {
          tournamentId: id,
          userId: session.user.id,
        },
      },
    });

    if (existingPlayer) {
      return NextResponse.json(
        { error: 'Already joined this tournament' },
        { status: 400 }
      );
    }

    // Check max players
    if (tournament.maxPlayers && tournament._count.players >= tournament.maxPlayers) {
      return NextResponse.json(
        { error: 'Tournament is full' },
        { status: 400 }
      );
    }

    // Get user's rating for the tournament time control
    const userRating = await prisma.rating.findUnique({
      where: {
        userId_tc_variant: {
          userId: session.user.id,
          tc: tournament.tc,
          variant: 'CHESS960',
        },
      },
      select: {
        rating: true,
      },
    });

    const rating = userRating?.rating ? Number(userRating.rating) : 1500;

    // Check rating requirements
    if (tournament.minRating && rating < tournament.minRating) {
      return NextResponse.json(
        { error: `Rating too low (minimum ${tournament.minRating})` },
        { status: 400 }
      );
    }

    if (tournament.maxRating && rating > tournament.maxRating) {
      return NextResponse.json(
        { error: `Rating too high (maximum ${tournament.maxRating})` },
        { status: 400 }
      );
    }

    // Join tournament
    const player = await prisma.tournamentPlayer.create({
      data: {
        tournamentId: id,
        userId: session.user.id,
        rating,
      },
    });

    return NextResponse.json({
      success: true,
      player: {
        id: player.id,
        rating: player.rating,
      },
    });
  } catch (error) {
    console.error('Failed to join tournament:', error);
    return NextResponse.json(
      { error: 'Failed to join tournament' },
      { status: 500 }
    );
  }
}
