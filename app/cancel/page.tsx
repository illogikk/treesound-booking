import Link from 'next/link';

export default function CancelPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 px-6 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-neutral-800 text-4xl">
        ✕
      </div>
      <h1 className="mb-3 text-3xl font-bold text-white">Payment Cancelled</h1>
      <p className="mb-8 max-w-md text-neutral-400">
        Your payment was cancelled and no charge was made. Your slot hold has been released.
      </p>
      <Link
        href="/rooms"
        className="inline-flex h-11 items-center rounded-full bg-emerald-500 px-6 text-sm font-semibold text-white transition-colors hover:bg-emerald-400"
      >
        Browse Rooms
      </Link>
    </main>
  );
}
