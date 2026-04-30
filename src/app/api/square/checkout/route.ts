import { NextRequest, NextResponse } from 'next/server';
import { squareClient, squareLocationId } from '@/lib/square';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// Create a Square Checkout link for a booking request
export async function POST(req: NextRequest) {
  try {
    const { room_id, start_ts, end_ts, total_cents, booking_id } = await req.json();
    if (!room_id || !start_ts || !end_ts || !total_cents) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const client = squareClient();
    const locationId = squareLocationId();

    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/booking/confirm?booking_id=${encodeURIComponent(
      booking_id || ''
    )}`;

    const { result } = await client.checkoutApi.createPaymentLink({
      idempotencyKey: crypto.randomUUID(),
      description: 'TreeSound booking',
      quickPay: {
        name: 'Studio booking',
        priceMoney: { amount: BigInt(total_cents), currency: 'USD' },
        locationId
      },
      checkoutOptions: {
        redirectUrl,
        askForShippingAddress: false
      },
      // Keep lightweight metadata
      metadata: {
        room_id,
        start_ts,
        end_ts
      }
    });

    return NextResponse.json({ url: result.paymentLink?.url });
  } catch (e: any) {
    console.error('square.checkout', e);
    return NextResponse.json({ error: 'Checkout error' }, { status: 500 });
  }
}

