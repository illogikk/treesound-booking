export default function Home() {
  return (
    <div className="grid gap-10 md:grid-cols-2 md:items-center">
      <div>
        <h1 className="text-4xl font-bold leading-tight md:text-5xl">Book your studio time in minutes</h1>
        <p className="mt-4 text-neutral-700">Simple, reliable reservations for DJ booths, recording rooms, podcast studios, and rehearsal spaces.</p>
        <div className="mt-8 flex gap-3">
          <a
            href="/login"
            className="rounded-[10px] bg-[var(--tsd-primary)] px-4 py-2 font-semibold text-white transition hover:opacity-90"
          >
            Sign in
          </a>
          <a
            href="#how-it-works"
            className="rounded-[10px] border border-[var(--tsd-primary)] px-4 py-2 text-[var(--tsd-primary)] transition hover:bg-[var(--tsd-primary)] hover:text-white"
          >
            How it works
          </a>
        </div>
      </div>
      <div className="rounded-[10px] border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="text-sm text-neutral-500">Coming soon</div>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-neutral-800">
          <li>Availability calendar by room</li>
          <li>Peak/off-peak pricing</li>
          <li>Stripe checkout + receipts</li>
          <li>Admin blocks and overrides</li>
        </ul>
      </div>
    </div>
  );
}
