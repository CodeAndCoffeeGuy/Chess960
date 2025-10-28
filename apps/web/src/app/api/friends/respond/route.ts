import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@chess960/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { requestId, action } = await request.json();

    if (!requestId || !action) {
      return NextResponse.json({ error: 'Request ID and action are required' }, { status: 400 });
    }

    if (action !== 'accept' && action !== 'decline') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Find the friend request
    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!friendRequest) {
      return NextResponse.json({ error: 'Friend request not found' }, { status: 404 });
    }

    if (friendRequest.receiverId !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized to respond to this request' }, { status: 403 });
    }

    if (friendRequest.status !== 'PENDING') {
      return NextResponse.json({ error: 'Friend request already responded to' }, { status: 400 });
    }

    if (action === 'accept') {
      // Get sender info for notification
      const sender = await prisma.user.findUnique({
        where: { id: friendRequest.senderId },
        select: { handle: true },
      });

      // Create friendship and update request status in a transaction
      await prisma.$transaction(async (tx) => {
        // Update friend request status
        await tx.friendRequest.update({
          where: { id: requestId },
          data: { status: 'ACCEPTED' },
        });

        // Create friendship (ensure user1Id < user2Id for consistency)
        const user1Id = friendRequest.senderId < friendRequest.receiverId ? friendRequest.senderId : friendRequest.receiverId;
        const user2Id = friendRequest.senderId < friendRequest.receiverId ? friendRequest.receiverId : friendRequest.senderId;

        await tx.friendship.create({
          data: {
            user1Id,
            user2Id,
          },
        });

        // Create notification for the sender that their friend request was accepted
        if (sender) {
          // Check if sender wants push notifications
          const senderSettings = await tx.user.findUnique({
            where: { id: friendRequest.senderId },
            select: { pushNotifications: true },
          });

          if (senderSettings?.pushNotifications !== false) {
            await tx.notification.create({
              data: {
                userId: friendRequest.senderId,
                type: 'FRIEND_REQUEST',
                title: 'Friend Request Accepted!',
                message: `${session.user.handle || 'Someone'} accepted your friend request`,
                friendRequestId: friendRequest.id,
                link: '/friends',
              },
            });
          }
        }
      });

      return NextResponse.json({ success: true, message: 'Friend request accepted' });
    } else {
      // Decline the request
      await prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: 'DECLINED' },
      });

      return NextResponse.json({ success: true, message: 'Friend request declined' });
    }
  } catch (error) {
    console.error('Respond to friend request error:', error);
    return NextResponse.json(
      { error: 'Failed to respond to friend request' },
      { status: 500 }
    );
  }
}
