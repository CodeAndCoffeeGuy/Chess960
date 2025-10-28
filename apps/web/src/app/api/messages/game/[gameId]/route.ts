import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@chess960/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gameId } = await params;

    // Verify user is part of the game
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: {
        whiteId: true,
        blackId: true,
      },
    });

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    if (game.whiteId !== session.user.id && game.blackId !== session.user.id) {
      return NextResponse.json(
        { error: 'You are not a player in this game' },
        { status: 403 }
      );
    }

    // Fetch messages for this game
    const messages = await prisma.message.findMany({
      where: {
        gameId,
        OR: [
          { senderId: session.user.id },
          { receiverId: session.user.id },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            handle: true,
            fullName: true,
            image: true,
          },
        },
        receiver: {
          select: {
            id: true,
            handle: true,
            fullName: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Mark messages as read where user is receiver
    await prisma.message.updateMany({
      where: {
        gameId,
        receiverId: session.user.id,
        read: false,
      },
      data: {
        read: true,
      },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Fetch game messages error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game messages' },
      { status: 500 }
    );
  }
}
