import { createEvent, type EventAttributes } from 'ics';

export interface CalendarEventInput {
  title: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
  uid?: string;
  url?: string;
}

/**
 * Generate an ICS calendar event string.
 */
export function generateICS(input: CalendarEventInput): Promise<string> {
  return new Promise((resolve, reject) => {
    const toArray = (d: Date): [number, number, number, number, number] => [
      d.getFullYear(),
      d.getMonth() + 1,
      d.getDate(),
      d.getHours(),
      d.getMinutes(),
    ];

    const event: EventAttributes = {
      start: toArray(input.start),
      end: toArray(input.end),
      title: input.title,
      description: input.description,
      location: input.location,
      uid: input.uid ?? `booking-${Date.now()}@treesound.com`,
      url: input.url,
      status: 'CONFIRMED',
      busyStatus: 'BUSY',
    };

    const { error, value } = createEvent(event);

    if (error || !value) {
      reject(error ?? new Error('Failed to generate ICS'));
    } else {
      resolve(value);
    }
  });
}

/**
 * Build an "Add to Google Calendar" URL.
 */
export function googleCalendarUrl(input: CalendarEventInput): string {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: input.title,
    dates: `${fmt(input.start)}/${fmt(input.end)}`,
    details: input.description ?? '',
    location: input.location ?? '',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
