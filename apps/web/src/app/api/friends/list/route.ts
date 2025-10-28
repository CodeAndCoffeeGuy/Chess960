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

    // Get pending friend requests received by the user
    const receivedRequests = await prisma.friendRequest.findMany({
      where: {
        receiverId: session.user.id,
        status: 'PENDING',
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get pending friend requests sent by the user
    const sentRequests = await prisma.friendRequest.findMany({
      where: {
        senderId: session.user.id,
        status: 'PENDING',
      },
      include: {
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

    // Get friends list
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { user1Id: session.user.id },
          { user2Id: session.user.id },
        ],
      },
      include: {
        user1: {
          select: {
            id: true,
            handle: true,
            fullName: true,
            image: true,
          },
        },
        user2: {
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

    // Transform friendships to show the friend (not the current user)
    const friends = friendships.map((friendship) => {
      const friend = friendship.user1Id === session.user.id ? friendship.user2 : friendship.user1;
      return {
        ...friend,
        friendshipId: friendship.id,
        friendsSince: friendship.createdAt,
      };
    });

    return NextResponse.json({
      receivedRequests,
      sentRequests,
      friends,
    });
  } catch (error) {
    console.error('List friends error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch friends list' },
      { status: 500 }
    );
  }
}
