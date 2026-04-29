import Link from 'next/link';
import { Suspense } from 'react';

export default function AuthErrorPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 px-6 text-center">
      <Suspense fallback={null}>
        <div className="mb-6 text-4xl">⚠️</div>
        <h1 className="mb-3 text-2xl font-bold text-white">Authentication Error</h1>
        <p className="mb-8 text-neutral-400">
          Something went wrong during sign-in. This link may have expired.
        </p>
        <Link
          href="/auth/signin"
          className="inline-flex h-11 items-center rounded-full bg-emerald-500 px-6 text-sm font-semibold text-white transition-colors hover:bg-emerald-400"
        >
          Try Again
        </Link>
      </Suspense>
    </main>
  );
}
