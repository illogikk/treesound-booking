'use client';

import { signIn } from 'next-auth/react';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function SignInForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/';
  const error = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    await signIn('email', {
      email,
      callbackUrl,
      redirect: false,
    });

    setSubmitted(true);
    setLoading(false);
  }

  if (submitted) {
    return (
      <div className="text-center">
        <div className="mb-4 text-4xl">✉️</div>
        <h2 className="mb-2 text-xl font-semibold text-white">Check your email</h2>
        <p className="text-neutral-400">
          We sent a magic link to <strong className="text-neutral-200">{email}</strong>. Click the
          link to sign in.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-neutral-300">
          Email address
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:border-emerald-500 focus:outline-none"
        />
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error === 'EmailSignin'
            ? 'Could not send sign-in email. Check your SMTP settings.'
            : 'An error occurred. Please try again.'}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-emerald-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-400 disabled:opacity-50"
      >
        {loading ? 'Sending…' : 'Send Magic Link'}
      </button>
    </form>
  );
}

export default function SignInPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold text-white">
            TreeSound
          </Link>
          <p className="mt-2 text-sm text-neutral-400">Sign in to book a studio session</p>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-8">
          <h1 className="mb-6 text-xl font-semibold text-white">Sign in</h1>
          <Suspense fallback={<p className="text-sm text-neutral-500">Loading…</p>}>
            <SignInForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-xs text-neutral-600">
          No password needed — we&apos;ll email you a secure link.
        </p>
      </div>
    </main>
  );
}
