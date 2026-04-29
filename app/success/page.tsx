import Link from 'next/link';
import { Suspense } from 'react';

import { prisma } from '@/lib/db';
import { googleCalendarUrl } from '@/lib/calendar';

async function SuccessContent({ bookingId }: { bookingId: string }) {
  const booking = bookingId
    ? await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { room: { include: { location: true } } },
      })
    : null;

  const gcalUrl = booking
    ? googleCalendarUrl({
        title: `${booking.room.name} @ TreeSound Studios`,
        description: `Your studio booking at TreeSound Studios.`,
        location: `${booking.room.location.address}, ${booking.room.location.city}, ${booking.room.location.state}`,
        start: booking.start,
        end: booking.end,
      })
    : null;

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 text-4xl">
        ✓
      </div>
      <h1 className="mb-3 text-3xl font-bold text-white">Booking Confirmed!</h1>
      <p className="mb-8 max-w-md text-neutral-400">
        {booking
          ? `You're booked into ${booking.room.name} on ${booking.start.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} from ${booking.start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} to ${booking.end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}.`
          : "We've received your booking. Check your email for confirmation details."}
      </p>
      <div className="flex flex-col gap-4 sm:flex-row">
        {gcalUrl && (
          <a
            href={gcalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center rounded-full border border-neutral-700 px-6 text-sm font-semibold text-neutral-200 transition-colors hover:border-neutral-500"
          >
            Add to Google Calendar
          </a>
        )}
        <Link
          href="/rooms"
          className="inline-flex h-11 items-center rounded-full bg-emerald-500 px-6 text-sm font-semibold text-white transition-colors hover:bg-emerald-400"
        >
          Book Another Room
        </Link>
      </div>
    </div>
  );
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ bookingId?: string; session_id?: string }>;
}) {
  const params = await searchParams;
  const bookingId = params.bookingId ?? '';

  return (
    <main className="flex min-h-screen flex-col bg-neutral-950">
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center">
            <p className="text-neutral-400">Loading…</p>
          </div>
        }
      >
        <SuccessContent bookingId={bookingId} />
      </Suspense>
    </main>
  );
}
