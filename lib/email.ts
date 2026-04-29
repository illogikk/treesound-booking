import nodemailer from 'nodemailer';

// Stub: replace with Resend SDK or configure SMTP in production
const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? 'localhost',
  port: Number(process.env.SMTP_PORT ?? 1025),
  secure: process.env.SMTP_SECURE === 'true',
  auth:
    process.env.SMTP_USER && process.env.SMTP_PASS
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
});

interface BookingEmailData {
  to: string;
  userName: string;
  roomName: string;
  locationName: string;
  start: Date;
  end: Date;
  totalCents: number;
  bookingId: string;
  icsAttachment?: string; // base64 ICS string
}

export async function sendBookingConfirmation(data: BookingEmailData): Promise<void> {
  const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
  const startStr = data.start.toLocaleString('en-US', { timeZone: 'America/Chicago' });
  const endStr = data.end.toLocaleString('en-US', { timeZone: 'America/Chicago' });
  const total = (data.totalCents / 100).toFixed(2);

  const html = `
    <h2>Booking Confirmed!</h2>
    <p>Hi ${data.userName},</p>
    <p>Your booking at <strong>${data.locationName}</strong> is confirmed.</p>
    <ul>
      <li><strong>Room:</strong> ${data.roomName}</li>
      <li><strong>Start:</strong> ${startStr}</li>
      <li><strong>End:</strong> ${endStr}</li>
      <li><strong>Total:</strong> $${total}</li>
    </ul>
    <p><a href="${appUrl}/bookings/${data.bookingId}">View your booking</a></p>
    <p>TreeSound Studios</p>
  `;

  const attachments = data.icsAttachment
    ? [
        {
          filename: 'booking.ics',
          content: Buffer.from(data.icsAttachment, 'base64'),
          contentType: 'text/calendar',
        },
      ]
    : [];

  await transport.sendMail({
    from: process.env.SMTP_FROM ?? 'noreply@treesound.com',
    to: data.to,
    subject: `Booking Confirmed – ${data.roomName}`,
    html,
    attachments,
  });
}

export async function sendMagicLink(to: string, url: string): Promise<void> {
  const html = `
    <h2>Sign in to TreeSound Booking</h2>
    <p><a href="${url}">Click here to sign in</a></p>
    <p>This link expires in 24 hours and can only be used once.</p>
    <p>If you did not request this, you can safely ignore this email.</p>
  `;

  await transport.sendMail({
    from: process.env.SMTP_FROM ?? 'noreply@treesound.com',
    to,
    subject: 'Sign in to TreeSound Booking',
    html,
  });
}

export async function sendCancellationNotice(data: {
  to: string;
  userName: string;
  roomName: string;
  start: Date;
  refundCents: number;
}): Promise<void> {
  const startStr = data.start.toLocaleString('en-US', { timeZone: 'America/Chicago' });
  const refund = (data.refundCents / 100).toFixed(2);

  const html = `
    <h2>Booking Cancelled</h2>
    <p>Hi ${data.userName},</p>
    <p>Your booking for <strong>${data.roomName}</strong> on ${startStr} has been cancelled.</p>
    ${data.refundCents > 0 ? `<p>A refund of <strong>$${refund}</strong> will be processed within 5-10 business days.</p>` : '<p>No refund applies per our cancellation policy.</p>'}
    <p>TreeSound Studios</p>
  `;

  await transport.sendMail({
    from: process.env.SMTP_FROM ?? 'noreply@treesound.com',
    to: data.to,
    subject: `Booking Cancelled – ${data.roomName}`,
    html,
  });
}
