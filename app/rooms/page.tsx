import Link from 'next/link';

import { prisma } from '@/lib/db';

export const revalidate = 60;

export default async function RoomsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; location?: string }>;
}) {
  const params = await searchParams;

  const rooms = await prisma.room.findMany({
    where: {
      active: true,
      ...(params.type ? { type: { name: params.type } } : {}),
      ...(params.location ? { locationId: params.location } : {}),
    },
    include: { type: true, location: true },
    orderBy: { name: 'asc' },
  });

  const roomTypes = await prisma.roomType.findMany({ orderBy: { name: 'asc' } });

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="text-3xl font-bold text-white">Available Rooms</h1>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <Link
              href="/rooms"
              className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                !params.type
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                  : 'border-neutral-700 text-neutral-400 hover:border-neutral-500'
              }`}
            >
              All
            </Link>
            {roomTypes.map((rt) => (
              <Link
                key={rt.id}
                href={`/rooms?type=${encodeURIComponent(rt.name)}`}
                className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                  params.type === rt.name
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : 'border-neutral-700 text-neutral-400 hover:border-neutral-500'
                }`}
              >
                {rt.name}
              </Link>
            ))}
          </div>
        </div>

        {rooms.length === 0 ? (
          <p className="text-neutral-400">No rooms found matching your filters.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <Link
                key={room.id}
                href={`/rooms/${room.slug}`}
                className="group block rounded-xl border border-neutral-800 bg-neutral-900 p-6 transition-colors hover:border-emerald-500/50"
              >
                {/* Photo placeholder */}
                <div className="mb-4 flex h-40 items-center justify-center rounded-lg bg-neutral-800 text-4xl">
                  {room.type.name === 'DJ Booth' && '🎧'}
                  {room.type.name === 'Recording Studio' && '🎙️'}
                  {room.type.name === 'Podcast Room' && '🎤'}
                  {room.type.name === 'Rehearsal Space' && '🥁'}
                </div>

                <div className="mb-1 flex items-start justify-between gap-2">
                  <h2 className="font-semibold text-white group-hover:text-emerald-400">
                    {room.name}
                  </h2>
                  <span className="shrink-0 text-sm font-semibold text-emerald-400">
                    ${(room.baseHourly / 100).toFixed(0)}/hr
                  </span>
                </div>

                <p className="mb-3 text-xs text-neutral-500">{room.type.name}</p>

                <p className="mb-4 line-clamp-2 text-sm text-neutral-400">{room.description}</p>

                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  <span>Up to {room.capacity} people</span>
                  <span>·</span>
                  <span>{room.location.name}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
