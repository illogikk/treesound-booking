'use client';

import { useState } from 'react';
import { format, addDays, startOfDay } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

interface Slot {
  start: string;
  end: string;
  available: boolean;
}

interface AvailabilityGridProps {
  roomId: string;
  roomSlug: string;
}

export function AvailabilityGrid({ roomId, roomSlug }: AvailabilityGridProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const { data, isLoading, error } = useQuery<Slot[]>({
    queryKey: ['availability', roomId, dateStr],
    queryFn: () =>
      fetch(`/api/availability?roomId=${roomId}&date=${dateStr}`).then((r) => r.json()),
  });

  const days = Array.from({ length: 7 }, (_, i) => addDays(startOfDay(new Date()), i));

  function handleBook() {
    if (!selectedSlot) return;
    const params = new URLSearchParams({
      roomId,
      start: selectedSlot.start,
      end: selectedSlot.end,
    });
    router.push(`/checkout?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      {/* Date picker row */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {days.map((d) => {
          const active = format(d, 'yyyy-MM-dd') === dateStr;
          return (
            <button
              key={d.toISOString()}
              onClick={() => {
                setSelectedDate(d);
                setSelectedSlot(null);
              }}
              className={`flex shrink-0 flex-col items-center rounded-lg px-3 py-2 text-xs transition-colors ${
                active
                  ? 'bg-emerald-500 text-white'
                  : 'border border-neutral-700 text-neutral-400 hover:border-neutral-500'
              }`}
            >
              <span className="font-medium">{format(d, 'EEE')}</span>
              <span>{format(d, 'd')}</span>
            </button>
          );
        })}
      </div>

      {/* Slots */}
      {isLoading && <p className="text-sm text-neutral-500">Loading availability…</p>}
      {error && <p className="text-sm text-red-400">Failed to load slots.</p>}

      {data && (
        <div className="grid grid-cols-3 gap-2">
          {data.map((slot) => {
            const isSelected = selectedSlot?.start === slot.start && selectedSlot?.end === slot.end;
            return (
              <button
                key={slot.start}
                disabled={!slot.available}
                onClick={() => setSelectedSlot(isSelected ? null : slot)}
                className={`rounded-lg py-2 text-xs font-medium transition-colors ${
                  !slot.available
                    ? 'cursor-not-allowed border border-neutral-800 text-neutral-700 line-through'
                    : isSelected
                      ? 'bg-emerald-500 text-white'
                      : 'border border-neutral-700 text-neutral-300 hover:border-emerald-500/50 hover:text-emerald-400'
                }`}
              >
                {format(new Date(slot.start), 'h:mm a')}
              </button>
            );
          })}
        </div>
      )}

      {selectedSlot && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
          <p className="text-emerald-300">
            {format(new Date(selectedSlot.start), 'EEE, MMM d')} ·{' '}
            {format(new Date(selectedSlot.start), 'h:mm a')} –{' '}
            {format(new Date(selectedSlot.end), 'h:mm a')}
          </p>
        </div>
      )}

      <button
        disabled={!selectedSlot}
        onClick={handleBook}
        className="w-full rounded-full bg-emerald-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {selectedSlot ? 'Book This Slot' : 'Select a Time Slot'}
      </button>
    </div>
  );
}
