import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// Mock webhook: marks a booking as paid when called with { booking_id }
export async function POST(req: NextRequest) {
  try {
    const { booking_id } = await req.json();
    if (!booking_id) return NextResponse.json({ error: 'booking_id required' }, { status: 400 });
    const admin = supabaseAdmin();
    await admin.from('bookings').update({ status: 'paid' }).eq('id', booking_id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('payments.webhook', e);
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}

