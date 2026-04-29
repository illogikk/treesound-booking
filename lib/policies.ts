/**
 * Cancellation policy for TreeSound Booking MVP.
 *
 * - >24h before start: full refund
 * - 2h–24h before start: 50% refund
 * - <2h before start: no refund
 */

export type CancellationPolicy = 'full' | 'partial' | 'none';

export interface CancellationResult {
  policy: CancellationPolicy;
  refundCents: number;
  cancellationFeeCents: number;
}

export function calculateCancellation(
  totalCents: number,
  bookingStart: Date,
  cancelledAt: Date = new Date(),
): CancellationResult {
  const hoursUntilStart = (bookingStart.getTime() - cancelledAt.getTime()) / (1000 * 60 * 60);

  if (hoursUntilStart > 24) {
    return {
      policy: 'full',
      refundCents: totalCents,
      cancellationFeeCents: 0,
    };
  } else if (hoursUntilStart >= 2) {
    const refundCents = Math.round(totalCents * 0.5);
    return {
      policy: 'partial',
      refundCents,
      cancellationFeeCents: totalCents - refundCents,
    };
  } else {
    return {
      policy: 'none',
      refundCents: 0,
      cancellationFeeCents: totalCents,
    };
  }
}

export const CANCELLATION_POLICY_TEXT = {
  full: 'Full refund (cancelled more than 24 hours before start)',
  partial: '50% refund (cancelled 2–24 hours before start)',
  none: 'No refund (cancelled less than 2 hours before start)',
} as const;

/**
 * Hold duration for provisional bookings (10 minutes).
 */
export const HOLD_DURATION_MS = 10 * 60 * 1000;

export function holdExpiresAt(from: Date = new Date()): Date {
  return new Date(from.getTime() + HOLD_DURATION_MS);
}
