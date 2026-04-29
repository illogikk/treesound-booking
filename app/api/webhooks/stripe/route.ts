import { NextResponse } from 'next/server';
import type Stripe from 'stripe';

import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import { releaseHold } from '@/lib/availability';
import { sendBookingConfirmation, sendCancellationNotice } from '@/lib/email';
import { generateICS } from '@/lib/calendar';

export const config = { api: { bodyParser: false } };

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    await handleStripeEvent(event);
  } catch (err) {
    console.error('Stripe webhook handler error:', err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingId = session.metadata?.bookingId;
      if (!bookingId) return;

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { user: true, room: { include: { location: true } } },
      });

      if (!booking) return;

      await prisma.$transaction([
        prisma.booking.update({
          where: { id: bookingId },
          data: { status: 'CONFIRMED', confirmedAt: new Date(), holdExpiresAt: null },
        }),
        prisma.payment.update({
          where: { bookingId },
          data: {
            status: 'SUCCEEDED',
            stripeSessionId: session.id,
            stripePaymentIntentId:
              typeof session.payment_intent === 'string' ? session.payment_intent : undefined,
          },
        }),
      ]);

      // Release Redis hold
      const holdKey = `hold:${booking.roomId}:${booking.start.getTime()}:${booking.end.getTime()}`;
      await releaseHold(holdKey);

      // Send confirmation email
      try {
        const icsContent = await generateICS({
          title: `${booking.room.name} @ TreeSound Studios`,
          location: `${booking.room.location.address}, ${booking.room.location.city}`,
          start: booking.start,
          end: booking.end,
          uid: `booking-${booking.id}@treesound.com`,
        });

        await sendBookingConfirmation({
          to: booking.user.email!,
          userName: booking.user.name ?? 'Valued Customer',
          roomName: booking.room.name,
          locationName: booking.room.location.name,
          start: booking.start,
          end: booking.end,
          totalCents: booking.totalCents,
          bookingId: booking.id,
          icsAttachment: Buffer.from(icsContent).toString('base64'),
        });
      } catch (err) {
        console.error('Failed to send confirmation email:', err);
      }

      break;
    }

    case 'checkout.session.expired': {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingId = session.metadata?.bookingId;
      if (!bookingId) return;

      // Release the hold — payment window expired
      const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
      if (booking && ['HOLD', 'PENDING'].includes(booking.status)) {
        await prisma.booking.update({
          where: { id: bookingId },
          data: { status: 'CANCELLED', cancelledAt: new Date() },
        });

        const holdKey = `hold:${booking.roomId}:${booking.start.getTime()}:${booking.end.getTime()}`;
        await releaseHold(holdKey);
      }
      break;
    }

    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntentId =
        typeof charge.payment_intent === 'string' ? charge.payment_intent : null;
      if (!paymentIntentId) return;

      const payment = await prisma.payment.findFirst({
        where: { stripePaymentIntentId: paymentIntentId },
        include: { booking: { include: { user: true, room: true } } },
      });

      if (!payment) return;

      const refundedAmount = charge.amount_refunded;
      const isFullRefund = refundedAmount >= payment.amount;

      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: {
            refundedAmount,
            status: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
          },
        }),
        prisma.booking.update({
          where: { id: payment.bookingId },
          data: { status: isFullRefund ? 'REFUNDED' : 'CONFIRMED' },
        }),
      ]);

      if (isFullRefund) {
        await sendCancellationNotice({
          to: payment.booking.user.email!,
          userName: payment.booking.user.name ?? 'Valued Customer',
          roomName: payment.booking.room.name,
          start: payment.booking.start,
          refundCents: refundedAmount,
        });
      }
      break;
    }

    default:
      // Unhandled event type — log and ignore
      console.log(`Unhandled Stripe event type: ${event.type}`);
  }
}
