import 'server-only';
import { prisma } from '@chess960/db';

function getVapidConfig() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:support@chess960.game';
  
  if (!publicKey || !privateKey) {
    console.warn('VAPID keys not configured for push notifications');
    return null;
  }
  
  return { publicKey, privateKey, subject };
}

export interface PushNotificationData {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  tag?: string;
}

export async function sendPushNotification(
  userId: string,
  data: PushNotificationData
): Promise<boolean> {
  try {
    const vapid = getVapidConfig();
    if (!vapid) return false;

    const { default: webpush } = await import('web-push');
    webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);

    // Get user's push subscriptions
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) return false;

    const payload = JSON.stringify({
      title: data.title,
      body: data.body,
      url: data.url || '/',
      icon: data.icon || '/android-chrome-192x192.png',
      tag: data.tag || 'chess960',
    });

    // Send to all user's subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth,
              },
            } as any,
            payload
          );
          return true;
        } catch (error: any) {
          // Remove invalid subscriptions
          if (error?.statusCode === 410 || error?.statusCode === 404) {
            await prisma.pushSubscription.delete({
              where: { endpoint: subscription.endpoint },
            });
          }
          console.error('Push notification error:', error?.message || error);
          return false;
        }
      })
    );

    // Return true if at least one notification was sent successfully
    return results.some(result => result.status === 'fulfilled' && result.value);
  } catch (error) {
    console.error('Send push notification error:', error);
    return false;
  }
}

export async function sendGameMoveNotification(
  gameId: string,
  playerId: string,
  opponentName: string,
  move: string
): Promise<boolean> {
  return sendPushNotification(playerId, {
    title: 'Chess960',
    body: `${opponentName} played ${move}`,
    url: `/game/${gameId}`,
    tag: `game-${gameId}`,
  });
}

export async function sendGameEndNotification(
  gameId: string,
  playerId: string,
  opponentName: string,
  result: string
): Promise<boolean> {
  return sendPushNotification(playerId, {
    title: 'Chess960',
    body: `Game ended: ${result} vs ${opponentName}`,
    url: `/game/${gameId}`,
    tag: `game-${gameId}`,
  });
}

export async function sendMessageNotification(
  recipientId: string,
  senderName: string,
  messagePreview: string
): Promise<boolean> {
  return sendPushNotification(recipientId, {
    title: 'Chess960',
    body: `${senderName}: ${messagePreview}`,
    url: '/messages',
    tag: 'message',
  });
}

export async function sendChallengeNotification(
  recipientId: string,
  challengerName: string,
  timeControl: string
): Promise<boolean> {
  return sendPushNotification(recipientId, {
    title: 'Chess960',
    body: `${challengerName} challenged you to a ${timeControl} game`,
    url: '/play',
    tag: 'challenge',
  });
}

export async function sendTournamentNotification(
  userId: string,
  tournamentName: string,
  message: string
): Promise<boolean> {
  return sendPushNotification(userId, {
    title: 'Chess960 Tournament',
    body: `${tournamentName}: ${message}`,
    url: '/tournaments',
    tag: 'tournament',
  });
}
