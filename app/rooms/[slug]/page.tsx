import { notFound } from 'next/navigation';
import Link from 'next/link';

import { prisma } from '@/lib/db';
import { AvailabilityGrid } from './AvailabilityGrid';

export const revalidate = 30;

export async function generateStaticParams() {
  const rooms = await prisma.room.findMany({ select: { slug: true } });
  return rooms.map((r) => ({ slug: r.slug }));
}

export default async function RoomDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const room = await prisma.room.findUnique({
    where: { slug },
    include: { type: true, location: true },
  });

  if (!room) notFound();

  const hourly = (room.baseHourly / 100).toFixed(0);

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4">
          <Link href="/rooms" className="text-sm text-neutral-500 hover:text-neutral-300">
            ← Back to rooms
          </Link>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
          {/* Left: details */}
          <div>
            {/* Photo placeholder */}
            <div className="mb-6 flex h-64 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900 text-6xl">
              {room.type.name === 'DJ Booth' && '🎧'}
              {room.type.name === 'Recording Studio' && '🎙️'}
              {room.type.name === 'Podcast Room' && '🎤'}
              {room.type.name === 'Rehearsal Space' && '🥁'}
            </div>

            <div className="mb-2 flex items-start justify-between">
              <h1 className="text-3xl font-bold text-white">{room.name}</h1>
              <span className="text-2xl font-bold text-emerald-400">${hourly}/hr</span>
            </div>

            <p className="mb-1 text-sm text-neutral-500">
              {room.type.name} · {room.location.name}, {room.location.city}, {room.location.state}
            </p>
            <p className="mb-1 text-sm text-neutral-500">Capacity: up to {room.capacity} people</p>

            <p className="my-6 text-neutral-300">{room.description}</p>

            {room.equipment.length > 0 && (
              <div>
                <h2 className="mb-3 text-lg font-semibold text-white">Equipment</h2>
                <ul className="grid gap-1 text-sm text-neutral-400 sm:grid-cols-2">
                  {room.equipment.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="text-emerald-500">✓</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right: availability + booking */}
          <div className="sticky top-6 self-start rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Select a Time</h2>
            <AvailabilityGrid roomId={room.id} roomSlug={room.slug} />
          </div>
        </div>
      </div>
    </main>
  );
}
