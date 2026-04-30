import { createSupabaseBrowser } from '@/lib/supabaseClient';

export default async function RoomsPage() {
  const supabase = createSupabaseBrowser();
  const { data } = await supabase.from('rooms').select('name, slug, description, hourly_rate_cents').eq('active', true);
  return (
    <div>
      <h1 className="text-3xl font-bold">Rooms</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {data?.map((r) => (
          <a key={r.slug} href={`/rooms/${r.slug}`} className="block rounded-[10px] border p-4 hover:bg-neutral-50">
            <div className="text-xl font-semibold">{r.name}</div>
            <div className="text-sm text-neutral-600">${(r.hourly_rate_cents / 100).toFixed(2)}/hr</div>
            <p className="mt-2 text-sm text-neutral-700">{r.description}</p>
          </a>
        ))}
      </div>
    </div>
  );
}

