import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@chess960/db';

// Create a test notification (for testing purposes)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type = 'SYSTEM' } = body;

    let title, message, link;

    switch (type) {
      case 'CHALLENGE':
        title = 'New Challenge!';
        message = 'TestUser challenges you to a 2+0 bullet game';
        link = '/play';
        break;
      case 'FRIEND_REQUEST':
        title = 'Friend Request';
        message = 'TestUser sent you a friend request';
        link = '/friends';
        break;
      case 'MESSAGE':
        title = 'New Message';
        message = 'You have a new message from TestUser';
        link = '/messages';
        break;
      case 'TOURNAMENT':
        title = 'Tournament Starting Soon';
        message = 'Your tournament "Bullet Arena" starts in 5 minutes!';
        link = '/tournaments';
        break;
      case 'SYSTEM':
      default:
        title = 'System Announcement';
        message = 'Welcome to Chess960! This is a test notification.';
        link = null;
        break;
    }

    const notification = await prisma.notification.create({
      data: {
        userId: session.user.id,
        type,
        title,
        message,
        link,
      },
    });

    return NextResponse.json({ notification, success: true });
  } catch (error) {
    console.error('Create test notification error:', error);
    return NextResponse.json(
      { error: 'Failed to create test notification' },
      { status: 500 }
    );
  }
}
