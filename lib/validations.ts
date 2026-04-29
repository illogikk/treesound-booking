import { z } from 'zod';

export const availabilityQuerySchema = z.object({
  roomId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  slotDuration: z.coerce.number().int().min(30).max(480).optional().default(60),
});

export const bookSchema = z.object({
  roomId: z.string().min(1),
  start: z.string().datetime(),
  end: z.string().datetime(),
  promoCode: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export const confirmSchema = z.object({
  bookingId: z.string().min(1),
  stripeSessionId: z.string().min(1),
});

export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;
export type BookInput = z.infer<typeof bookSchema>;
export type ConfirmInput = z.infer<typeof confirmSchema>;
