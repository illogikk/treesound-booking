import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isAvailable, acquireHold } from '@/lib/availability';
import { calculatePrice, applyPromo } from '@/lib/pricing';
import { holdExpiresAt } from '@/lib/policies';
import { stripe } from '@/lib/stripe';
import { bookSchema } from '@/lib/validations';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = bookSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { roomId, start: startStr, end: endStr, promoCode, notes } = parsed.data;
  const start = new Date(startStr);
  const end = new Date(endStr);

  if (start >= end) {
    return NextResponse.json({ error: 'Start must be before end' }, { status: 400 });
  }

  // Check availability
  const available = await isAvailable(roomId, start, end);
  if (!available) {
    return NextResponse.json({ error: 'This time slot is no longer available' }, { status: 409 });
  }

  // Get room + price rules
  const room = await prisma.room.findUnique({
    where: { id: roomId, active: true },
    include: { location: true, priceRules: true },
  });

  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  // Get user
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Calculate price
  const locationPriceRules = await prisma.priceRule.findMany({
    where: { locationId: room.locationId },
  });
  const allRules = [...room.priceRules, ...locationPriceRules];
  const { totalCents } = calculatePrice(room, start, end, allRules);

  // Apply promo
  let discountCents = 0;
  let promoId: string | undefined;

  if (promoCode) {
    const now = new Date();
    const promo = await prisma.promo.findFirst({
      where: {
        code: promoCode.toUpperCase(),
        active: true,
        AND: [
          { OR: [{ validFrom: null }, { validFrom: { lte: now } }] },
          { OR: [{ validTo: null }, { validTo: { gte: now } }] },
        ],
      },
    });

    if (promo && (!promo.maxUses || promo.used < promo.maxUses)) {
      const applied = applyPromo(totalCents, promo);
      discountCents = applied.discountCents;
      promoId = promo.id;
    }
  }

  const finalCents = totalCents - discountCents;

  // Acquire Redis hold
  const holdKey = await acquireHold(roomId, start, end, user.id);
  if (!holdKey) {
    return NextResponse.json(
      { error: 'Could not acquire hold — slot was just taken' },
      { status: 409 },
    );
  }

  // Create provisional booking
  const booking = await prisma.booking.create({
    data: {
      userId: user.id,
      roomId,
      start,
      end,
      status: 'HOLD',
      totalCents: finalCents,
      discountCents,
      promoId,
      notes,
      holdExpiresAt: holdExpiresAt(),
    },
  });

  // Create Stripe Checkout Session
  const appUrl = process.env.APP_URL ?? 'http://localhost:3000';

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${room.name} — ${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`,
              description: `${room.location.name} · ${Math.round((end.getTime() - start.getTime()) / 3600000)}h booking`,
            },
            unit_amount: finalCents,
          },
          quantity: 1,
        },
      ],
      metadata: { bookingId: booking.id },
      success_url: `${appUrl}/success?bookingId=${booking.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/cancel`,
      expires_at: Math.floor((Date.now() + 10 * 60 * 1000) / 1000), // 10 min
    });

    // Create Payment record
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        stripeSessionId: checkoutSession.id,
        amount: finalCents,
        currency: 'usd',
        status: 'PENDING',
      },
    });

    // Update booking to PENDING
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'PENDING' },
    });

    return NextResponse.json({
      bookingId: booking.id,
      checkoutUrl: checkoutSession.url,
    });
  } catch (err) {
    // Clean up on Stripe failure
    await prisma.booking.delete({ where: { id: booking.id } });
    console.error('Stripe session creation failed:', err);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
