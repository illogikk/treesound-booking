import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function BookingConfirmPage({ searchParams }: { searchParams: { booking_id?: string } }) {
  const id = searchParams?.booking_id;
  if (!id) return <div className="p-6">Missing booking id.</div>;
  const admin = supabaseAdmin();
  const { data: booking } = await admin
    .from('bookings')
    .select('id, status, start_ts, end_ts, total_cents, room:room_id(name)')
    .eq('id', id)
    .single();
  if (!booking) return <div className="p-6">Booking not found.</div>;
  const start = new Date(booking.start_ts);
  const end = new Date(booking.end_ts);
  const paid = booking.status === 'paid';
  // Supabase relation embedding for FK can come back as an object or array depending on inference
  const roomRel: any = (booking as any).room;
  const roomName = Array.isArray(roomRel) ? roomRel[0]?.name : roomRel?.name;
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{paid ? 'Booking confirmed' : 'Booking pending'}</h1>
      <div className="mt-2 text-neutral-700">Room: {roomName || '—'}</div>
      <div className="mt-1">Start: {start.toLocaleString()}</div>
      <div className="mt-1">End: {end.toLocaleString()}</div>
      <div className="mt-2 font-semibold">Total: ${(booking.total_cents / 100).toFixed(2)}</div>
      {!paid && <div className="mt-4 text-amber-700">Awaiting payment confirmation…</div>}
    </div>
  );
}
