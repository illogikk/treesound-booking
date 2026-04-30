import { createSupabaseBrowser } from '@/lib/supabaseClient';

export default async function RoomDetail({ params }: { params: { slug: string } }) {
  const supabase = createSupabaseBrowser();
  const { data: room } = await supabase.from('rooms').select('*').eq('slug', params.slug).single();
  if (!room) return <div>Room not found.</div>;
  return (
    <div>
      <h1 className="text-3xl font-bold">{room.name}</h1>
      <div className="mt-2 text-neutral-700">{room.description}</div>
      <div className="mt-2 font-semibold">Rate: ${(room.hourly_rate_cents / 100).toFixed(2)}/hr</div>
      <div className="mt-6 rounded-[10px] border p-4">
        <div className="text-sm text-neutral-600">MVP booking flow coming next: pick date/time → checkout with Square.</div>
      </div>
    </div>
  );
}

