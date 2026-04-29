export default function Home() {
  return (
    <div className="grid gap-10 md:grid-cols-2 md:items-center">
      <div>
        <h1 className="text-4xl font-bold leading-tight md:text-5xl">Book your studio time in minutes</h1>
        <p className="mt-4 text-neutral-300">Simple, reliable reservations for DJ booths, recording rooms, podcast studios, and rehearsal spaces.</p>
        <div className="mt-8 flex gap-3">
          <a href="/login" className="rounded-md bg-emerald-500 px-4 py-2 font-semibold text-black hover:bg-emerald-400 transition">Sign in</a>
          <a href="#how-it-works" className="rounded-md border border-neutral-700 px-4 py-2 text-neutral-200 hover:bg-neutral-900 transition">How it works</a>
        </div>
      </div>
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-6">
        <div className="text-sm text-neutral-400">Coming soon</div>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-neutral-200">
          <li>Availability calendar by room</li>
          <li>Peak/off-peak pricing</li>
          <li>Stripe checkout + receipts</li>
          <li>Admin blocks and overrides</li>
        </ul>
      </div>
    </div>
  );
}
