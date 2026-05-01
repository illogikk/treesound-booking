import { createSupabaseBrowser } from '@/lib/supabaseClient';
import BookingWidget from './BookingWidget';

export default async function RoomDetail({ params }: { params: { slug: string } }) {
  const supabase = createSupabaseBrowser();
  const { data: room } = await supabase.from('rooms').select('*').eq('slug', params.slug).single();
  if (!room) return <div>Room not found.</div>;
  return (
    <div>
      <h1 className="text-3xl font-bold">{room.name}</h1>
      <div className="mt-2 text-neutral-700">{room.description}</div>
      <div className="mt-2 font-semibold">Rate: ${(room.hourly_rate_cents / 100).toFixed(2)}/hr</div>
      <div className="mt-6">
        {/* Booking flow (mock payments now; Square later via env flip) */}
        <BookingWidget roomId={room.id} rateCents={room.hourly_rate_cents} />
      </div>
    </div>
  );
}
