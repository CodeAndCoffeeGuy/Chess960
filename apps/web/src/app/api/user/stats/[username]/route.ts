import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@chess960/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const session = await getServerSession(authOptions);

    const user = await prisma.user.findUnique({
      where: { handle: username },
      select: {
        id: true,
        handle: true,
        fullName: true,
        country: true,
        gamesPlayed: true,
        gamesWon: true,
        gamesLost: true,
        gamesDrawn: true,
        createdAt: true,
        lastActivityAt: true,
        ratings: {
          select: {
            tc: true,
            rating: true,
            rd: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If user is logged in, include friend status
    let friendStatus: 'none' | 'pending' | 'friends' = 'none';
    if (session?.user?.id && session.user.id !== user.id) {
      // Check for friendship
      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { user1Id: session.user.id, user2Id: user.id },
            { user1Id: user.id, user2Id: session.user.id },
          ],
        },
      });

      if (friendship) {
        friendStatus = 'friends';
      } else {
        // Check for pending friend request
        const friendRequest = await prisma.friendRequest.findFirst({
          where: {
            OR: [
              { senderId: session.user.id, receiverId: user.id, status: 'PENDING' },
              { senderId: user.id, receiverId: session.user.id, status: 'PENDING' },
            ],
          },
        });

        if (friendRequest) {
          friendStatus = 'pending';
        }
      }
    }

    return NextResponse.json({ ...user, friendStatus });
  } catch (error) {
    console.error('Fetch user stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user statistics' },
      { status: 500 }
    );
  }
}
