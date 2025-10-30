import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@chess960/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const beforeParam = searchParams.get('before'); // ISO date string

    const whereBase = {
      OR: [
        { senderId: session.user.id, receiverId: userId },
        { senderId: userId, receiverId: session.user.id },
      ],
    } as const;

    // Fetch newest first with optional before filter
    const where = beforeParam
      ? { ...whereBase, createdAt: { lt: new Date(beforeParam) } }
      : whereBase;

    const newestFirst = await prisma.message.findMany({
      where,
      include: {
        sender: {
          select: { id: true, handle: true, fullName: true, image: true },
        },
        receiver: {
          select: { id: true, handle: true, fullName: true, image: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Reverse to ascending for UI rendering
    const messages = [...newestFirst].reverse();

    // Determine hasMore by checking if there are older messages beyond oldest
    let hasMore = false;
    if (messages.length > 0) {
      const oldest = messages[0];
      const olderCount = await prisma.message.count({
        where: {
          ...whereBase,
          createdAt: { lt: oldest.createdAt },
        },
      });
      hasMore = olderCount > 0;
    }

    // Mark all unread messages from this user as read
    await prisma.message.updateMany({
      where: {
        senderId: userId,
        receiverId: session.user.id,
        read: false,
      },
      data: {
        read: true,
      },
    });

    return NextResponse.json({ messages, hasMore });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
