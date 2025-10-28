import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@chess960/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gameId } = await params;

    // Check if game exists
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: {
        id: true,
        whiteId: true,
        blackId: true,
        endedAt: true,
      },
    });

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Check if user is a player in the game
    if (game.whiteId === session.user.id || game.blackId === session.user.id) {
      return NextResponse.json(
        { error: 'You are a player in this game' },
        { status: 400 }
      );
    }

    // Add or update spectator
    const spectator = await prisma.gameSpectator.upsert({
      where: {
        gameId_userId: {
          gameId,
          userId: session.user.id,
        },
      },
      create: {
        gameId,
        userId: session.user.id,
      },
      update: {
        joinedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            handle: true,
            fullName: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, spectator });
  } catch (error) {
    console.error('Join game as spectator error:', error);
    return NextResponse.json(
      { error: 'Failed to join game as spectator' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gameId } = await params;

    // Remove spectator
    await prisma.gameSpectator.deleteMany({
      where: {
        gameId,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Leave game as spectator error:', error);
    return NextResponse.json(
      { error: 'Failed to leave game' },
      { status: 500 }
    );
  }
}

// Get spectators list
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;

    const spectators = await prisma.gameSpectator.findMany({
      where: { gameId },
      include: {
        user: {
          select: {
            id: true,
            handle: true,
            fullName: true,
            image: true,
          },
        },
      },
      orderBy: {
        joinedAt: 'desc',
      },
    });

    return NextResponse.json({ spectators });
  } catch (error) {
    console.error('Fetch spectators error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch spectators' },
      { status: 500 }
    );
  }
}
