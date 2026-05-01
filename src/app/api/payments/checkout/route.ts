import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { squareClient, squareLocationId } from '@/lib/square';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const provider = (process.env.PAYMENT_PROVIDER || 'mock').toLowerCase();
  try {
    const { room_id, start_ts, end_ts, total_cents } = await req.json();
    if (!room_id || !start_ts || !end_ts || !total_cents) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const redirectUrlBase = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    if (provider === 'square') {
      // Create a Square Checkout link mirroring the square route behavior
      const client = squareClient();
      const locationId = squareLocationId();
      const bookingId = crypto.randomUUID();

      // Create a provisional booking record (held) we can mark paid on webhook
      const admin = supabaseAdmin();
      await admin.from('bookings').insert({
        id: bookingId,
        room_id,
        start_ts,
        end_ts,
        total_cents,
        status: 'held'
      });

      const redirectUrl = `${redirectUrlBase}/booking/confirm?booking_id=${encodeURIComponent(bookingId)}`;

      const { result } = await client.checkoutApi.createPaymentLink({
        idempotencyKey: crypto.randomUUID(),
        description: 'TreeSound booking',
        quickPay: {
          name: 'Studio booking',
          priceMoney: { amount: BigInt(total_cents), currency: 'USD' },
          locationId
        },
        checkoutOptions: { redirectUrl, askForShippingAddress: false },
        metadata: { room_id, start_ts, end_ts, booking_id: bookingId }
      });

      return NextResponse.json({ url: result.paymentLink?.url });
    }

    // Mock provider: immediately create a paid booking and redirect locally
    const admin = supabaseAdmin();
    const { data, error } = await admin
      .from('bookings')
      .insert({ room_id, start_ts, end_ts, total_cents, status: 'paid' })
      .select('id')
      .single();
    if (error) throw error;

    const redirectUrl = `${redirectUrlBase}/booking/confirm?booking_id=${encodeURIComponent(data.id)}`;
    return NextResponse.json({ url: redirectUrl });
  } catch (e) {
    console.error('payments.checkout', e);
    return NextResponse.json({ error: 'Checkout error' }, { status: 500 });
  }
}
