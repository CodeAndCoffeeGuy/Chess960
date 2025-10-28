import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@chess960/db';

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get users the current user is following
    const following = await prisma.follow.findMany({
      where: {
        followerId: session.user.id,
      },
      include: {
        following: {
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

    // Get users following the current user
    const followers = await prisma.follow.findMany({
      where: {
        followingId: session.user.id,
      },
      include: {
        follower: {
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

    return NextResponse.json({
      following: following.map(f => f.following),
      followers: followers.map(f => f.follower),
    });
  } catch (error) {
    console.error('Error fetching follows:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
