import { prisma } from '@chess960/db';

export interface NotificationBroadcast {
  t: 'notification.new';
  notification: {
    id: string;
    type: 'CHALLENGE' | 'FRIEND_REQUEST' | 'MESSAGE' | 'TOURNAMENT' | 'SYSTEM';
    title: string;
    message: string;
    read: boolean;
    link: string | null;
    challengeId: string | null;
    friendRequestId: string | null;
    tournamentId: string | null;
    gameId: string | null;
    createdAt: string;
  };
}

/**
 * Broadcast a notification to a user via WebSocket
 * This function should be called after creating a notification in the database
 */
export async function broadcastNotificationToUser(
  userId: string,
  notificationId: string,
  wsBroadcast?: (userId: string, message: any) => void
): Promise<void> {
  try {
    // Get the notification from database
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      console.error('Notification not found for broadcast:', notificationId);
      return;
    }

    // Create broadcast message
    const broadcastMessage: NotificationBroadcast = {
      t: 'notification.new',
      notification: {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        read: notification.read,
        link: notification.link,
        challengeId: notification.challengeId,
        friendRequestId: notification.friendRequestId,
        tournamentId: notification.tournamentId,
        gameId: notification.gameId,
        createdAt: notification.createdAt.toISOString(),
      },
    };

    // Broadcast via WebSocket if available
    if (wsBroadcast) {
      wsBroadcast(userId, broadcastMessage);
    }

  } catch (error) {
    console.error('Failed to broadcast notification:', error);
  }
}

/**
 * Broadcast notification count update to a user
 */
export async function broadcastNotificationCountToUser(
  userId: string,
  wsBroadcast?: (userId: string, message: any) => void
): Promise<void> {
  try {
    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });

    const broadcastMessage = {
      t: 'notification.count',
      count: unreadCount,
    };

    // Broadcast via WebSocket if available
    if (wsBroadcast) {
      wsBroadcast(userId, broadcastMessage);
    }
  } catch (error) {
    console.error('Failed to broadcast notification count:', error);
  }
}
