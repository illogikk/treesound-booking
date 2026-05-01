"use client";

import { useMemo, useState } from 'react';

export default function BookingWidget({ roomId, rateCents }: { roomId: string; rateCents: number }) {
  const [start, setStart] = useState<string>('');
  const [end, setEnd] = useState<string>('');
  const totalCents = useMemo(() => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    const ms = e.getTime() - s.getTime();
    if (ms <= 0) return 0;
    const hours = ms / (1000 * 60 * 60);
    return Math.round(hours * rateCents);
  }, [start, end, rateCents]);

  const book = async () => {
    if (!start || !end || totalCents <= 0) return;
    const res = await fetch('/api/payments/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room_id: roomId, start_ts: start, end_ts: end, total_cents: totalCents })
    });
    const json = await res.json();
    if (json?.url) window.location.href = json.url;
  };

  // Default helpers: now rounded to next hour
  const nowLocal = () => {
    const d = new Date();
    d.setMinutes(0, 0, 0);
    d.setHours(d.getHours() + 1);
    return d.toISOString().slice(0, 16);
  };

  return (
    <div className="rounded-[10px] border p-4">
      <div className="text-sm text-neutral-600">Pick date and time, then proceed to checkout.</div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <label className="text-sm">
          Start
          <input
            type="datetime-local"
            className="mt-1 w-full rounded border p-2"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            placeholder={nowLocal()}
          />
        </label>
        <label className="text-sm">
          End
          <input
            type="datetime-local"
            className="mt-1 w-full rounded border p-2"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            placeholder={nowLocal()}
          />
        </label>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="text-sm text-neutral-700">Total: <strong>${(totalCents / 100).toFixed(2)}</strong></div>
        <button
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
          onClick={book}
          disabled={!start || !end || totalCents <= 0}
        >
          Book now
        </button>
      </div>
    </div>
  );
}

