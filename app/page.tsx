import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col">
      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-24 text-center">
        <div className="inline-flex items-center rounded-full border border-neutral-700 px-4 py-1.5 text-sm text-neutral-400">
          Nashville, TN · DJ · Recording · Podcast · Rehearsal
        </div>
        <h1 className="max-w-3xl text-5xl font-bold tracking-tight text-white md:text-6xl lg:text-7xl">
          Book your studio session at{' '}
          <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            TreeSound
          </span>
        </h1>
        <p className="max-w-xl text-lg text-neutral-400">
          Professional recording studios, DJ booths, podcast suites, and rehearsal spaces —
          available by the hour. No memberships required.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link
            href="/rooms"
            className="inline-flex h-12 items-center rounded-full bg-emerald-500 px-8 text-base font-semibold text-white transition-colors hover:bg-emerald-400"
          >
            Browse Rooms
          </Link>
          <Link
            href="/auth/signin"
            className="inline-flex h-12 items-center rounded-full border border-neutral-700 px-8 text-base font-semibold text-neutral-200 transition-colors hover:border-neutral-500 hover:text-white"
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-neutral-800 bg-neutral-900 px-6 py-16">
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
          {[
            {
              icon: '🎵',
              title: 'Multiple Room Types',
              body: 'DJ booths, recording studios, podcast rooms, and rehearsal spaces — all in one location.',
            },
            {
              icon: '📅',
              title: 'Real-Time Availability',
              body: 'See open slots instantly. Conflict-free holds keep your booking secure during checkout.',
            },
            {
              icon: '⚡',
              title: 'Instant Confirmation',
              body: 'Pay via Stripe Checkout and get an immediate email confirmation with a calendar invite.',
            },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
              <div className="mb-3 text-3xl">{f.icon}</div>
              <h3 className="mb-2 text-lg font-semibold text-white">{f.title}</h3>
              <p className="text-sm text-neutral-400">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-800 px-6 py-8 text-center text-sm text-neutral-500">
        &copy; {new Date().getFullYear()} TreeSound Studios. All rights reserved.
      </footer>
    </main>
  );
}
