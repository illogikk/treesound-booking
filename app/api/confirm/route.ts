import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { releaseHold } from '@/lib/availability';
import { sendBookingConfirmation } from '@/lib/email';
import { generateICS } from '@/lib/calendar';
import { confirmSchema } from '@/lib/validations';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = confirmSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { bookingId, stripeSessionId } = parsed.data;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      user: true,
      room: { include: { location: true } },
      payment: true,
    },
  });

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  if (booking.user.email !== session.user.email) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (booking.status === 'CONFIRMED') {
    return NextResponse.json({ bookingId: booking.id, status: 'already_confirmed' });
  }

  // Update booking and payment status
  await prisma.$transaction([
    prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CONFIRMED', confirmedAt: new Date(), holdExpiresAt: null },
    }),
    prisma.payment.update({
      where: { bookingId },
      data: { status: 'SUCCEEDED', stripeSessionId },
    }),
  ]);

  // Release Redis hold
  const holdKey = `hold:${booking.roomId}:${booking.start.getTime()}:${booking.end.getTime()}`;
  await releaseHold(holdKey);

  // Send confirmation email with ICS
  try {
    const icsContent = await generateICS({
      title: `${booking.room.name} @ TreeSound Studios`,
      description: `Your studio booking at TreeSound Studios.`,
      location: `${booking.room.location.address}, ${booking.room.location.city}, ${booking.room.location.state}`,
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
    // Email failure should not block confirmation
    console.error('Failed to send confirmation email:', err);
  }

  return NextResponse.json({ bookingId: booking.id, status: 'confirmed' });
}
