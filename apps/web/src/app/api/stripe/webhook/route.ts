import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@chess960/db';

export async function POST(request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-09-30.clover',
    });

    const body = await request.text();
    const signature = request.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode === 'payment') {
          await handleOneTimePayment(session);
        } else if (session.mode === 'subscription') {
          await handleSubscription(session, stripe);
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleOneTimePayment(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId || null;
  const amount = (session.amount_total || 0) / 100;

  await prisma.donation.create({
    data: {
      userId,
      amount,
      currency: session.currency?.toUpperCase() || 'USD',
      type: 'ONE_TIME',
      status: 'COMPLETED',
      stripePaymentId: session.payment_intent as string,
      stripeCustomerId: session.customer as string,
      stripePayerEmail: session.customer_details?.email,
      stripePayerName: session.customer_details?.name,
      completedAt: new Date(),
    },
  });

  if (userId) {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { supporterSince: true },
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        isSupporter: true,
        supporterSince: existingUser?.supporterSince || new Date(),
      },
    });
  }
}

async function handleSubscription(session: Stripe.Checkout.Session, stripe: Stripe) {
  const userId = session.metadata?.userId;
  if (!userId) return;

  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  );

  const amount = (subscription.items.data[0]?.price.unit_amount || 0) / 100;

  await prisma.subscription.create({
    data: {
      userId,
      amount,
      currency: subscription.currency.toUpperCase(),
      status: 'ACTIVE',
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0]?.price.id,
      stripeCustomerId: subscription.customer as string,
      stripePayerEmail: session.customer_details?.email,
      stripePayerName: session.customer_details?.name,
      nextBillingDate: new Date((subscription as any).current_period_end * 1000),
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      isSupporter: true,
      supporterSince: new Date(),
    },
  });
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const status = subscription.status === 'active' ? 'ACTIVE' : 'CANCELLED';

  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status,
      nextBillingDate:
        subscription.status === 'active'
          ? new Date((subscription as any).current_period_end * 1000)
          : null,
      cancelledAt: subscription.status === 'canceled' ? new Date() : null,
    },
  });

  if (subscription.status === 'canceled') {
    const sub = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscription.id },
      select: { userId: true },
    });

    if (sub?.userId) {
      const activeSubscriptions = await prisma.subscription.count({
        where: {
          userId: sub.userId,
          status: 'ACTIVE',
        },
      });

      if (activeSubscriptions === 0) {
        await prisma.user.update({
          where: { id: sub.userId },
          data: { isSupporter: false },
        });
      }
    }
  }
}
