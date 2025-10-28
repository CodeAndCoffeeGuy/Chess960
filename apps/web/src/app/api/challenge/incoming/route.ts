import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@chess960/db';

// Get incoming challenges for current user
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all pending challenges for this user
    const challenges = await prisma.challenge.findMany({
      where: {
        receiverId: session.user.id,
        status: 'PENDING',
        expiresAt: {
          gt: new Date(), // Not expired
        },
      },
      include: {
        sender: {
          select: {
            id: true,
            handle: true,
            fullName: true,
            image: true,
            ratings: {
              select: {
                tc: true,
                rating: true,
                rd: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ challenges });
  } catch (error) {
    console.error('Fetch incoming challenges error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch challenges' },
      { status: 500 }
    );
  }
}
