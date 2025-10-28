import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@chess960/db';

// Accept challenge
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ challengeId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { challengeId } = await params;

    // Get the challenge
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        sender: {
          select: {
            id: true,
            handle: true,
          },
        },
        receiver: {
          select: {
            id: true,
            handle: true,
          },
        },
      },
    });

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    // Only the receiver can accept
    if (challenge.receiverId !== session.user.id) {
      return NextResponse.json(
        { error: 'You are not the recipient of this challenge' },
        { status: 403 }
      );
    }

    // Check if already responded
    if (challenge.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'This challenge has already been responded to' },
        { status: 400 }
      );
    }

    // Check if expired
    if (new Date() > challenge.expiresAt) {
      await prisma.challenge.update({
        where: { id: challengeId },
        data: { status: 'EXPIRED' },
      });
      return NextResponse.json({ error: 'This challenge has expired' }, { status: 400 });
    }

    // Update challenge status
    await prisma.challenge.update({
      where: { id: challengeId },
      data: {
        status: 'ACCEPTED',
        respondedAt: new Date(),
      },
    });

    // Create the game
    const timeControl = challenge.tc === 'ONE_PLUS_ZERO' ? { time: 60000, inc: 0 } : { time: 120000, inc: 0 };

    const game = await prisma.game.create({
      data: {
        whiteId: Math.random() > 0.5 ? challenge.senderId : challenge.receiverId,
        blackId: Math.random() > 0.5 ? challenge.senderId : challenge.receiverId,
        tc: challenge.tc,
        rated: challenge.rated,
        whiteTimeMs: timeControl.time,
        blackTimeMs: timeControl.time,
        whiteIncMs: timeControl.inc,
        blackIncMs: timeControl.inc,
      },
    });

    // Ensure white and black are different players
    if (game.whiteId === game.blackId) {
      await prisma.game.update({
        where: { id: game.id },
        data: {
          blackId: game.whiteId === challenge.senderId ? challenge.receiverId : challenge.senderId,
        },
      });
    }

    // Check if sender wants game notifications
    const senderSettings = await prisma.user.findUnique({
      where: { id: challenge.senderId },
      select: { gameNotifications: true },
    });

    // Create notification for the sender only if they want game notifications
    if (senderSettings?.gameNotifications !== false) {
      await prisma.notification.create({
        data: {
          userId: challenge.senderId,
          type: 'CHALLENGE',
          title: 'Challenge Accepted!',
          message: `${challenge.receiver.handle} accepted your ${challenge.tc} challenge`,
          challengeId: challenge.id,
          gameId: game.id,
          link: '/play',
        },
      });
    }

    return NextResponse.json({ success: true, gameId: game.id });
  } catch (error) {
    console.error('Accept challenge error:', error);
    return NextResponse.json(
      { error: 'Failed to accept challenge' },
      { status: 500 }
    );
  }
}

// Decline or cancel challenge
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ challengeId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { challengeId } = await params;

    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    // Check if user is sender or receiver
    const isSender = challenge.senderId === session.user.id;
    const isReceiver = challenge.receiverId === session.user.id;

    if (!isSender && !isReceiver) {
      return NextResponse.json(
        { error: 'You are not part of this challenge' },
        { status: 403 }
      );
    }

    // Check if already responded
    if (challenge.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'This challenge has already been responded to' },
        { status: 400 }
      );
    }

    // Update status: CANCELLED if sender, DECLINED if receiver
    await prisma.challenge.update({
      where: { id: challengeId },
      data: {
        status: isSender ? 'CANCELLED' : 'DECLINED',
        respondedAt: new Date(),
      },
    });

    // Create notification for the other party
    const otherUserId = isSender ? challenge.receiverId : challenge.senderId;
    const action = isSender ? 'cancelled' : 'declined';
    
    // Check if other user wants game notifications
    const otherUserSettings = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: { gameNotifications: true },
    });

    // Create notification only if they want game notifications
    if (otherUserSettings?.gameNotifications !== false) {
      await prisma.notification.create({
        data: {
          userId: otherUserId,
          type: 'CHALLENGE',
          title: `Challenge ${action.charAt(0).toUpperCase() + action.slice(1)}`,
          message: `Your challenge was ${action}`,
          challengeId: challenge.id,
          link: '/play',
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Decline/cancel challenge error:', error);
    return NextResponse.json(
      { error: 'Failed to decline/cancel challenge' },
      { status: 500 }
    );
  }
}
