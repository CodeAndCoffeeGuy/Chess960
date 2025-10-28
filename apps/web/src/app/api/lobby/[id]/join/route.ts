import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@chess960/db';

// POST /api/lobby/[id]/join - Join a lobby and create a game
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const userId = (session.user as any).id;

    // Find the lobby
    const lobby = await prisma.lobby.findUnique({
      where: { id },
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
    });

    if (!lobby) {
      return NextResponse.json({ error: 'Lobby not found' }, { status: 404 });
    }

    // Check if user is trying to join their own lobby
    if (lobby.hostId === userId) {
      return NextResponse.json(
        { error: 'You cannot join your own lobby' },
        { status: 400 }
      );
    }

    // Get user's rating
    const userRating = await prisma.rating.findUnique({
      where: {
        userId_tc_variant: {
          userId,
          tc: '1+0', // Use 1+0 bullet rating as default
          variant: 'CHESS960',
        },
      },
      select: {
        rating: true,
      },
    });

    const rating = userRating?.rating ? Number(userRating.rating) : 1500;

    // Check if user's rating is within the lobby's range
    if (rating < lobby.minRating || rating > lobby.maxRating) {
      return NextResponse.json(
        { error: `Your rating (${rating}) is outside the lobby's rating range (${lobby.minRating}-${lobby.maxRating})` },
        { status: 400 }
      );
    }

    // Parse time control (e.g., "3+0" -> 3 minutes, 0 increment)
    // Handle both formats: "3+0" and "30s+0"
    let baseMinutes: number;
    let incrementSeconds: number;

    if (lobby.timeControl.includes('s+')) {
      // Format: "30s+2"
      const [baseSeconds, inc] = lobby.timeControl.split('s+').map(Number);
      baseMinutes = baseSeconds / 60;
      incrementSeconds = inc;
    } else {
      // Format: "3+0"
      [baseMinutes, incrementSeconds] = lobby.timeControl.split('+').map(Number);
    }

    const baseTimeMs = Math.round(baseMinutes * 60 * 1000);
    const incrementMs = incrementSeconds * 1000;

    // Random color assignment
    const isWhite = Math.random() < 0.5;

    // Generate a random Chess960 position (1-960)
    const chess960Position = Math.floor(Math.random() * 960) + 1;

    // Create the game
    const game = await prisma.game.create({
      data: {
        whiteId: isWhite ? userId : lobby.hostId,
        blackId: isWhite ? lobby.hostId : userId,
        tc: lobby.timeControl, // Use the lobby's time control directly
        rated: lobby.rated,
        variant: 'CHESS960',
        chess960Position,
        whiteTimeMs: baseTimeMs,
        blackTimeMs: baseTimeMs,
        whiteIncMs: incrementMs,
        blackIncMs: incrementMs,
        startedAt: new Date(),
      },
    });

    // Delete the lobby
    await prisma.lobby.delete({
      where: { id },
    });

    return NextResponse.json({ gameId: game.id, success: true });
  } catch (error) {
    console.error('Failed to join lobby:', error);
    return NextResponse.json(
      { error: 'Failed to join lobby' },
      { status: 500 }
    );
  }
}
