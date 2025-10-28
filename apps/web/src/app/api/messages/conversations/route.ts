import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@chess960/db';

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all messages where the user is either sender or receiver
    const messages = await prisma.message.findMany({
      where: {
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
        createdAt: 'desc',
      },
    });

    // Group messages by conversation (other user)
    const conversationsMap = new Map();

    messages.forEach((message) => {
      const otherUserId = message.senderId === session.user.id ? message.receiverId : message.senderId;
      const otherUser = message.senderId === session.user.id ? message.receiver : message.sender;

      if (!conversationsMap.has(otherUserId)) {
        conversationsMap.set(otherUserId, {
          user: otherUser,
          lastMessage: message,
          unreadCount: 0,
        });
      }

      // Count unread messages (messages sent to current user that are not read)
      if (message.receiverId === session.user.id && !message.read) {
        const conversation = conversationsMap.get(otherUserId);
        conversation.unreadCount++;
      }
    });

    // Convert map to array and sort by last message time
    const conversations = Array.from(conversationsMap.values()).sort((a, b) => {
      return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime();
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}
