import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@chess960/db';
import webpush from 'web-push';

function getVapidConfig() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:support@chess960.game';
  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey, subject };
}

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const vapid = getVapidConfig();
    if (!vapid) {
      return NextResponse.json({ error: 'Server VAPID keys not configured' }, { status: 500 });
    }

    webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);

    const subs = await prisma.pushSubscription.findMany({ where: { userId: session.user.id } });
    if (subs.length === 0) {
      return NextResponse.json({ error: 'No subscriptions found' }, { status: 404 });
    }

    const payload = JSON.stringify({
      title: 'Chess960',
      body: 'Test notification: You are set to receive updates!',
      url: '/notifications',
    });

    // Send to all subscriptions
    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: s.endpoint,
              keys: { p256dh: s.p256dh, auth: s.auth },
            } as any,
            payload
          );
        } catch (err: any) {
          if (err?.statusCode === 410 || err?.statusCode === 404) {
            // Remove stale subscription
            await prisma.pushSubscription.delete({ where: { endpoint: s.endpoint } });
          } else {
            console.error('Push send error:', err?.message || err);
          }
        }
      })
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Push test error:', error);
    return NextResponse.json({ error: 'Failed to send test' }, { status: 500 });
  }
}


