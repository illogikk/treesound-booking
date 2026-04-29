import { NextResponse } from 'next/server';

import { getAvailableSlots } from '@/lib/availability';
import { availabilityQuerySchema } from '@/lib/validations';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const parsed = availabilityQuerySchema.safeParse({
    roomId: searchParams.get('roomId'),
    date: searchParams.get('date'),
    slotDuration: searchParams.get('slotDuration'),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { roomId, date, slotDuration } = parsed.data;

  const [year, month, day] = date.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);

  const slots = await getAvailableSlots(roomId, dateObj, slotDuration);

  return NextResponse.json(
    slots.map((s) => ({
      start: s.start.toISOString(),
      end: s.end.toISOString(),
      available: s.available,
    })),
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
