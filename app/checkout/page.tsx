'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { format } from 'date-fns';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const roomId = searchParams.get('roomId') ?? '';
  const startStr = searchParams.get('start') ?? '';
  const endStr = searchParams.get('end') ?? '';

  const [promoCode, setPromoCode] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{
    roomName: string;
    totalCents: number;
    discountCents: number;
  } | null>(null);

  useEffect(() => {
    if (!roomId || !startStr || !endStr) return;

    fetch('/api/book/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, start: startStr, end: endStr }),
    })
      .then((r) => r.json())
      .then(setSummary)
      .catch(() => setSummary(null));
  }, [roomId, startStr, endStr]);

  async function handleCheckout() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, start: startStr, end: endStr, promoCode, notes }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Booking failed. Please try again.');
        return;
      }

      // Redirect to Stripe Checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        router.push(`/success?bookingId=${data.bookingId}`);
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!roomId || !startStr || !endStr) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950">
        <p className="text-neutral-400">Invalid booking parameters.</p>
      </div>
    );
  }

  const start = new Date(startStr);
  const end = new Date(endStr);
  const total = summary ? (summary.totalCents - summary.discountCents) / 100 : null;

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12">
      <div className="mx-auto max-w-lg">
        <h1 className="mb-8 text-3xl font-bold text-white">Checkout</h1>

        {/* Booking Summary */}
        <div className="mb-6 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Booking Summary</h2>

          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-400">Room</dt>
              <dd className="text-white">{summary?.roomName ?? '…'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-400">Date</dt>
              <dd className="text-white">{format(start, 'EEEE, MMMM d, yyyy')}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-400">Time</dt>
              <dd className="text-white">
                {format(start, 'h:mm a')} – {format(end, 'h:mm a')}
              </dd>
            </div>
            {summary && summary.discountCents > 0 && (
              <div className="flex justify-between text-emerald-400">
                <dt>Discount</dt>
                <dd>-${(summary.discountCents / 100).toFixed(2)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-neutral-800 pt-2 font-semibold">
              <dt className="text-neutral-200">Total</dt>
              <dd className="text-white">{total !== null ? `$${total.toFixed(2)}` : '…'}</dd>
            </div>
          </dl>
        </div>

        {/* Promo Code */}
        <div className="mb-4">
          <label className="mb-1 block text-sm text-neutral-400" htmlFor="promo">
            Promo Code (optional)
          </label>
          <input
            id="promo"
            type="text"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            placeholder="e.g. TREESOUND10"
            className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label className="mb-1 block text-sm text-neutral-400" htmlFor="notes">
            Notes (optional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Any special requests or notes for the studio team…"
            className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {error && (
          <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </p>
        )}

        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full rounded-full bg-emerald-500 py-3 text-base font-semibold text-white transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Processing…' : 'Pay with Stripe'}
        </button>

        <p className="mt-4 text-center text-xs text-neutral-500">
          By booking, you agree to our cancellation policy. Payments are secured by Stripe.
        </p>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-neutral-950">
          <p className="text-neutral-400">Loading…</p>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
