import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@chess960/db';
import { sendMessageNotification } from '@/lib/push-notifications';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { receiverId, content, gameId } = await request.json();

    // Validation
    if (!receiverId || !content || !gameId) {
      return NextResponse.json(
        { error: 'Receiver ID, content, and game ID are required' },
        { status: 400 }
      );
    }

    if (content.trim().length === 0 || content.length > 1000) {
      return NextResponse.json(
        { error: 'Message must be between 1 and 1000 characters' },
        { status: 400 }
      );
    }

    if (receiverId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot send message to yourself' },
        { status: 400 }
      );
    }

    // Check if receiver allows game messages
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, allowGameMessages: true },
    });

    if (!receiver) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!receiver.allowGameMessages) {
      return NextResponse.json(
        { error: 'This user is not accepting game messages' },
        { status: 403 }
      );
    }

    // Verify that both users are part of the game
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

    const isPlayerInGame =
      (game.whiteId === session.user.id || game.blackId === session.user.id) &&
      (game.whiteId === receiverId || game.blackId === receiverId);

    if (!isPlayerInGame) {
      return NextResponse.json(
        { error: 'Both users must be players in this game' },
        { status: 403 }
      );
    }

    // Create game message
    const message = await prisma.message.create({
      data: {
        senderId: session.user.id,
        receiverId,
        content: content.trim(),
        gameId,
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
    });

    // Send push notification to receiver
    try {
      const senderName = message.sender.fullName || message.sender.handle;
      const messagePreview = content.length > 50 ? content.substring(0, 50) + '...' : content;
      await sendMessageNotification(receiverId, senderName, messagePreview);
    } catch (error) {
      console.error('Failed to send push notification for game message:', error);
      // Don't fail the message send if push notification fails
    }

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error('Send game message error:', error);
    return NextResponse.json(
      { error: 'Failed to send game message' },
      { status: 500 }
    );
  }
}
