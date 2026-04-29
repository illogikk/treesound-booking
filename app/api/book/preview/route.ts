import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { calculatePrice } from '@/lib/pricing';

export async function POST(request: Request) {
  const body = await request.json();
  const { roomId, start: startStr, end: endStr } = body;

  if (!roomId || !startStr || !endStr) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const start = new Date(startStr);
  const end = new Date(endStr);

  const room = await prisma.room.findUnique({
    where: { id: roomId, active: true },
    include: {
      priceRules: true,
      location: { include: { priceRules: true } },
    },
  });

  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  const allRules = [...room.priceRules, ...room.location.priceRules];
  const { totalCents } = calculatePrice(room, start, end, allRules);

  return NextResponse.json({
    roomName: room.name,
    totalCents,
    discountCents: 0,
  });
}
