import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@chess960/db';

// GET /api/tournaments/[id]/messages - Get tournament chat messages
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

    // Check if tournament exists
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { id: true },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Verify user is a participant in the tournament
    const tournamentPlayer = await prisma.tournamentPlayer.findUnique({
      where: {
        tournamentId_userId: {
          tournamentId: tournamentId,
          userId: session.user.id,
        },
      },
    });

    if (!tournamentPlayer) {
      return NextResponse.json(
        { error: 'You must join the tournament to view messages' },
        { status: 403 }
      );
    }

    // Get query parameters for pagination
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Fetch messages with user information
    const messages = await prisma.tournamentMessage.findMany({
      where: { tournamentId },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        content: true,
        createdAt: true,
        userId: true,
      },
    });

    // Fetch user handles for all message senders
    const userIds = [...new Set(messages.map(m => m.userId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, handle: true },
    });

    const userMap = new Map(users.map(u => [u.id, u.handle]));

    // Format messages with user handles
    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      userId: msg.userId,
      handle: userMap.get(msg.userId) || 'Unknown',
      message: msg.content,
      timestamp: msg.createdAt.getTime(),
    }));

    return NextResponse.json({
      messages: formattedMessages,
      hasMore: messages.length === limit,
    });
  } catch (error) {
    console.error('Failed to fetch tournament messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
