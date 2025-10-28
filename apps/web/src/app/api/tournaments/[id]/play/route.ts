import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@chess960/db';

// POST /api/tournaments/[id]/play - Find opponent and create tournament game
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
        players: {
          where: {
            withdrawn: false,
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

    // Check if tournament is live
    if (tournament.status !== 'LIVE') {
      return NextResponse.json(
        { error: 'Tournament is not currently active' },
        { status: 400 }
      );
    }

    // Check if user is in tournament
    const player = tournament.players.find(p => p.userId === session.user.id);
    if (!player) {
      return NextResponse.json(
        { error: 'You are not in this tournament' },
        { status: 400 }
      );
    }

    // Check if player is under anti-ragequit delay
    if (player.delayUntil && new Date(player.delayUntil) > new Date()) {
      const remainingSeconds = Math.ceil((new Date(player.delayUntil).getTime() - Date.now()) / 1000);
      return NextResponse.json(
        {
          error: `You must wait ${remainingSeconds} seconds before playing again. This delay resets after 20 minutes without losses.`,
          delaySeconds: remainingSeconds
        },
        { status: 429 }
      );
    }

    // Check if user is already in a game
    const existingGame = await prisma.game.findFirst({
      where: {
        OR: [
          { whiteId: session.user.id },
          { blackId: session.user.id },
        ],
        result: 'ongoing',
      },
    });

    if (existingGame) {
      return NextResponse.json(
        { error: 'You are already in a game', gameId: existingGame.id },
        { status: 400 }
      );
    }

    // Find available opponents
    const minTimeBetweenGames = 2000; // 2 seconds
    const now = Date.now();

    // Get recent game times for all players
    const recentGames = await prisma.game.findMany({
      where: {
        OR: tournament.players.map(p => ({
          OR: [
            { whiteId: p.userId },
            { blackId: p.userId },
          ],
        })),
        result: { not: 'ongoing' },
      },
      select: {
        whiteId: true,
        blackId: true,
        endedAt: true,
      },
      orderBy: {
        endedAt: 'desc',
      },
    });

    // Build map of userId -> lastGameEndedAt
    const lastGameTimes = new Map<string, Date>();
    for (const game of recentGames) {
      if (game.endedAt) {
        if (game.whiteId && !lastGameTimes.has(game.whiteId)) {
          lastGameTimes.set(game.whiteId, game.endedAt);
        }
        if (game.blackId && !lastGameTimes.has(game.blackId)) {
          lastGameTimes.set(game.blackId, game.endedAt);
        }
      }
    }

    // Filter available opponents
    const availableOpponents = [];
    for (const p of tournament.players) {
      if (p.userId === session.user.id) continue;
      if (p.withdrawn) continue;

      // Check if opponent is under anti-ragequit delay
      if (p.delayUntil && new Date(p.delayUntil) > new Date()) {
        continue;
      }

      // Check if enough time has passed since last game
      const lastGameTime = lastGameTimes.get(p.userId);
      if (lastGameTime) {
        const timeSince = now - lastGameTime.getTime();
        if (timeSince < minTimeBetweenGames) continue;
      }

      // Check if not currently in a game
      const inGame = await prisma.game.findFirst({
        where: {
          OR: [
            { whiteId: p.userId },
            { blackId: p.userId },
          ],
          result: 'ongoing',
        },
      });

      if (inGame) continue;

      availableOpponents.push(p);
    }

    if (availableOpponents.length === 0) {
      return NextResponse.json(
        { error: 'No opponents available right now. Please try again in a moment.' },
        { status: 404 }
      );
    }

    // Sort by rating proximity
    availableOpponents.sort((a, b) => {
      const diffA = Math.abs(a.rating - player.rating);
      const diffB = Math.abs(b.rating - player.rating);
      return diffA - diffB;
    });

    const opponent = availableOpponents[0];

    // Randomly assign colors
    const isWhite = Math.random() < 0.5;
    const whiteId = isWhite ? session.user.id : opponent.userId;
    const blackId = isWhite ? opponent.userId : session.user.id;

    // Parse time control (e.g., "5+3" = 5 minutes + 3 second increment)
    const [timeStr, incStr] = tournament.tc.split('+');
    const timeMinutes = parseInt(timeStr) || 5;
    const incrementSeconds = parseInt(incStr) || 0;
    
    const timeMs = timeMinutes * 60 * 1000; // Convert to milliseconds
    const incMs = incrementSeconds * 1000; // Convert to milliseconds

    // Create game
    const game = await prisma.game.create({
      data: {
        whiteId,
        blackId,
        tc: tournament.tc,
        rated: true, // Tournament games are always rated
        result: 'ongoing',
        whiteTimeMs: timeMs,
        blackTimeMs: timeMs,
        whiteIncMs: incMs,
        blackIncMs: incMs,
      },
    });

    return NextResponse.json({
      success: true,
      gameId: game.id,
      color: isWhite ? 'white' : 'black',
      opponent: {
        id: opponent.userId,
        rating: opponent.rating,
      },
    });
  } catch (error) {
    console.error('Failed to find tournament pairing:', error);
    return NextResponse.json(
      { error: 'Failed to find opponent' },
      { status: 500 }
    );
  }
}
