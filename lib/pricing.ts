import type { PriceRule, Room } from '@prisma/client';

export interface PriceRuleSchedule {
  daysOfWeek?: number[];
  startHour?: number;
  endHour?: number;
}

/**
 * Calculate the total price in cents for a booking.
 * Applies the highest-priority matching price rule.
 */
export function calculatePrice(
  room: Room,
  start: Date,
  end: Date,
  priceRules: PriceRule[],
): { totalCents: number; hourlyRate: number; appliedRule: PriceRule | null } {
  const durationMs = end.getTime() - start.getTime();
  const durationHours = durationMs / (1000 * 60 * 60);

  if (durationHours <= 0) {
    throw new Error('End time must be after start time');
  }

  const baseHourly = room.baseHourly; // already in cents

  // Find matching rules sorted by priority desc
  const matchingRules = priceRules
    .filter((rule) => ruleMatchesWindow(rule, start, end))
    .sort((a, b) => b.priority - a.priority);

  const appliedRule = matchingRules[0] ?? null;
  let effectiveHourly = baseHourly;

  if (appliedRule) {
    if (appliedRule.kind === 'PEAK' || appliedRule.kind === 'OFF_PEAK') {
      effectiveHourly = Math.round(baseHourly * appliedRule.rate);
    } else if (appliedRule.kind === 'FLAT') {
      effectiveHourly = appliedRule.rate;
    }
  }

  const totalCents = Math.round(effectiveHourly * durationHours);

  return { totalCents, hourlyRate: effectiveHourly, appliedRule };
}

function ruleMatchesWindow(rule: PriceRule, start: Date, end: Date): boolean {
  if (rule.validFrom && start < rule.validFrom) return false;
  if (rule.validTo && end > rule.validTo) return false;

  const schedule = rule.schedule as PriceRuleSchedule | null;
  if (!schedule) return true; // applies always

  const dayOfWeek = start.getDay();
  const hour = start.getHours();

  if (schedule.daysOfWeek && !schedule.daysOfWeek.includes(dayOfWeek)) return false;
  if (schedule.startHour !== undefined && hour < schedule.startHour) return false;
  if (schedule.endHour !== undefined && hour >= schedule.endHour) return false;

  return true;
}

/**
 * Apply a promo code discount to a total.
 */
export function applyPromo(
  totalCents: number,
  promo: { type: 'PERCENTAGE' | 'FIXED'; value: number },
): { discountCents: number; finalCents: number } {
  let discountCents = 0;

  if (promo.type === 'PERCENTAGE') {
    discountCents = Math.round(totalCents * (promo.value / 100));
  } else if (promo.type === 'FIXED') {
    discountCents = Math.round(promo.value);
  }

  discountCents = Math.min(discountCents, totalCents);
  return { discountCents, finalCents: totalCents - discountCents };
}
