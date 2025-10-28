import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@chess960/db';
import { RedisClient } from '@chess960/redis-client';

interface QueuedPlayer {
  userId: string;
  teamId: string;
  entryId: string;
  rating: number;
  joinedAt: number;
}

const redis = RedisClient.getInstance();

function getQueueKey(tournamentId: string): string {
  return `team-tournament:${tournamentId}:queue`;
}

function getUserQueueKey(tournamentId: string, userId: string): string {
  return `team-tournament:${tournamentId}:user:${userId}:queue-status`;
}

// POST /api/team-tournaments/[id]/queue - Join waiting queue
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: tournamentId } = await params;
    const userId = session.user.id;

    // Verify tournament is live
    const tournament = await prisma.teamTournament.findUnique({
      where: { id: tournamentId },
      include: {
        teamEntries: {
          include: {
            players: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    if (tournament.status !== 'LIVE') {
      return NextResponse.json({ error: 'Tournament is not currently active' }, { status: 400 });
    }

    // Find which team the user belongs to
    let userTeamId: string | null = null;
    let userEntryId: string | null = null;
    let userRating = 1500;

    for (const entry of tournament.teamEntries) {
      const player = entry.players.find(p => p.userId === userId);
      if (player && player.active && !entry.withdrawn) {
        userTeamId = entry.teamId;
        userEntryId = entry.id;
        userRating = player.rating;
        break;
      }
    }

    if (!userTeamId || !userEntryId) {
      return NextResponse.json({ error: 'You are not registered in this tournament' }, { status: 403 });
    }

    // Check if user is already in queue
    const existingStatus = await redis.get(getUserQueueKey(tournamentId, userId));
    if (existingStatus === 'queued') {
      return NextResponse.json({ error: 'Already in queue' }, { status: 400 });
    }

    // Add to queue
    const queuedPlayer: QueuedPlayer = {
      userId,
      teamId: userTeamId,
      entryId: userEntryId,
      rating: userRating,
      joinedAt: Date.now(),
    };

    await redis.zadd(
      getQueueKey(tournamentId),
      Date.now(),
      JSON.stringify(queuedPlayer)
    );

    // Mark user as queued
    await redis.set(
      getUserQueueKey(tournamentId, userId),
      'queued',
      3600 // Expire after 1 hour
    );

    // Publish queue update
    await redis.publish('tournament:team:queue:join', {
      tournamentId,
      userId,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, inQueue: true });
  } catch (error) {
    console.error('Failed to join queue:', error);
    return NextResponse.json(
      { error: 'Failed to join queue' },
      { status: 500 }
    );
  }
}

// DELETE /api/team-tournaments/[id]/queue - Leave waiting queue
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: tournamentId } = await params;
    const userId = session.user.id;

    // Remove from queue
    const queueKey = getQueueKey(tournamentId);
    const members = await redis.zrange(queueKey, 0, -1);

    for (const member of members) {
      const player: QueuedPlayer = JSON.parse(member);
      if (player.userId === userId) {
        await redis.zrem(queueKey, member);
        break;
      }
    }

    // Remove queue status
    await redis.del(getUserQueueKey(tournamentId, userId));

    // Publish queue update
    await redis.publish('tournament:team:queue:leave', {
      tournamentId,
      userId,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, inQueue: false });
  } catch (error) {
    console.error('Failed to leave queue:', error);
    return NextResponse.json(
      { error: 'Failed to leave queue' },
      { status: 500 }
    );
  }
}

// GET /api/team-tournaments/[id]/queue - Get current queue
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: tournamentId } = await params;
    const userId = session.user.id;

    // Get queue
    const queueKey = getQueueKey(tournamentId);
    const members = await redis.zrange(queueKey, 0, -1);
    const queue = members.map(member => JSON.parse(member) as QueuedPlayer);

    // Check if user is in queue
    const userStatus = await redis.get(getUserQueueKey(tournamentId, userId));
    const inQueue = userStatus === 'queued';

    return NextResponse.json({
      queue,
      size: queue.length,
      inQueue,
    });
  } catch (error) {
    console.error('Failed to get queue:', error);
    return NextResponse.json(
      { error: 'Failed to get queue' },
      { status: 500 }
    );
  }
}
