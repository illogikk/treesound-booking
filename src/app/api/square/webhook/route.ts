import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// Verify Square webhook signature (v2)
function verifySignature(req: NextRequest, body: string) {
  const signature = req.headers.get('x-square-hmacsha256-signature') || '';
  const key = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY || '';
  if (!key || !signature) return false;
  const computed = crypto.createHmac('sha256', key).update(body).digest('base64');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computed));
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!verifySignature(req, raw)) return NextResponse.json({ ok: false }, { status: 401 });
  const evt = JSON.parse(raw);

  // Handle successful payments
  if (evt?.type?.includes('payment') && evt?.data?.object?.payment?.status === 'COMPLETED') {
    const payment = evt.data.object.payment;
    const bookingId = payment?.orderId || null; // optional: map if stored
    const admin = supabaseAdmin();
    if (bookingId) {
      await admin
        .from('bookings')
        .update({ status: 'paid', square_payment_id: payment.id })
        .eq('id', bookingId);
    }
  }

  return NextResponse.json({ ok: true });
}

