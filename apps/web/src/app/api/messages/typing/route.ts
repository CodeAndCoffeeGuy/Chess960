import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

/**
 * POST /api/messages/typing
 *
 * Sends a typing indicator to another user via WebSocket broadcast.
 * This endpoint is called when a user starts typing in a conversation.
 *
 * The typing indicator is throttled on the client side to prevent spam
 * (max once per 3 seconds per conversation).
 */
export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { receiverId } = body;

    if (!receiverId) {
      return NextResponse.json(
        { error: 'Receiver ID is required' },
        { status: 400 }
      );
    }

    // TODO: Broadcast typing event via WebSocket to the receiver
    // This will be implemented when WebSocket server supports typing events
    // For now, we'll use the realtime service URL
    const wsUrl = process.env.REALTIME_SERVICE_URL || 'http://localhost:3001';

    try {
      await fetch(`${wsUrl}/api/broadcast/typing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: (session.user as any).id,
          senderHandle: (session.user as any).handle,
          receiverId,
          type: 'message.typing',
        }),
      });
    } catch (error) {
      // Silent fail - typing indicators are not critical
      console.error('Failed to broadcast typing event:', error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending typing indicator:', error);
    return NextResponse.json(
      { error: 'Failed to send typing indicator' },
      { status: 500 }
    );
  }
}
