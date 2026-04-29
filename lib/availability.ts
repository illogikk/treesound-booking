import { prisma } from './db';
import { redis } from './redis';

const HOLD_DURATION_SECONDS = 10 * 60; // 10 minutes

/**
 * Check if a room is available for the given time window.
 * Returns true if no confirmed/hold bookings overlap.
 */
export async function isAvailable(roomId: string, start: Date, end: Date): Promise<boolean> {
  const conflict = await prisma.booking.findFirst({
    where: {
      roomId,
      status: { in: ['HOLD', 'PENDING', 'CONFIRMED'] },
      AND: [{ start: { lt: end } }, { end: { gt: start } }],
    },
  });

  return conflict === null;
}

/**
 * Place a Redis-based hold on a room slot (optimistic lock).
 * Returns the hold key if successful, null if already held.
 */
export async function acquireHold(
  roomId: string,
  start: Date,
  end: Date,
  userId: string,
): Promise<string | null> {
  const holdKey = buildHoldKey(roomId, start, end);

  // NX = only set if not exists, EX = expire in seconds
  const result = await redis.set(holdKey, userId, {
    nx: true,
    ex: HOLD_DURATION_SECONDS,
  });

  return result === 'OK' ? holdKey : null;
}

/**
 * Release a Redis hold (e.g. on payment success or timeout).
 */
export async function releaseHold(holdKey: string): Promise<void> {
  await redis.del(holdKey);
}

/**
 * Get all available slots for a room on a given date.
 * Returns array of {start, end} pairs based on open-hours schedule.
 */
export async function getAvailableSlots(
  roomId: string,
  date: Date,
  slotDurationMinutes = 60,
): Promise<Array<{ start: Date; end: Date; available: boolean }>> {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      location: {
        include: { scheduleRules: { where: { ruleType: 'OPEN' } } },
      },
      scheduleRules: { where: { ruleType: 'OPEN' } },
    },
  });

  if (!room) return [];

  const dayOfWeek = date.getDay();

  // Find open hours for this day (room-level overrides location-level)
  const rules = room.scheduleRules.length > 0 ? room.scheduleRules : room.location.scheduleRules;

  type OpenHourEntry = { dayOfWeek: number; openHour: number; closeHour: number };
  let openHour = 8;
  let closeHour = 22;

  for (const rule of rules) {
    const hours = rule.openHours as OpenHourEntry[] | null;
    if (!hours) continue;
    const entry = hours.find((h) => h.dayOfWeek === dayOfWeek);
    if (entry) {
      openHour = entry.openHour;
      closeHour = entry.closeHour;
    }
  }

  // Get existing bookings for the day
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const bookings = await prisma.booking.findMany({
    where: {
      roomId,
      status: { in: ['HOLD', 'PENDING', 'CONFIRMED'] },
      start: { gte: dayStart, lt: dayEnd },
    },
    select: { start: true, end: true },
  });

  const slots: Array<{ start: Date; end: Date; available: boolean }> = [];
  const slotMs = slotDurationMinutes * 60 * 1000;

  let cursor = new Date(date);
  cursor.setHours(openHour, 0, 0, 0);
  const closeTime = new Date(date);
  closeTime.setHours(closeHour, 0, 0, 0);

  while (cursor.getTime() + slotMs <= closeTime.getTime()) {
    const slotStart = new Date(cursor);
    const slotEnd = new Date(cursor.getTime() + slotMs);

    const overlaps = bookings.some(
      (b) => b.start.getTime() < slotEnd.getTime() && b.end.getTime() > slotStart.getTime(),
    );

    slots.push({ start: slotStart, end: slotEnd, available: !overlaps });
    cursor = slotEnd;
  }

  return slots;
}

function buildHoldKey(roomId: string, start: Date, end: Date): string {
  return `hold:${roomId}:${start.getTime()}:${end.getTime()}`;
}
