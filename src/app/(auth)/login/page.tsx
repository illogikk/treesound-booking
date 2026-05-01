'use client';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createSupabaseBrowser } from '@/lib/supabaseClient';

export default function LoginPage() {
  const supabase = createSupabaseBrowser();
  // Prefer an explicit site URL to avoid localhost links in production
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '');
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-md rounded-[10px] border border-[var(--tsd-primary)] bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="mt-1 text-sm text-neutral-600">Use email + password (no magic link).</p>
        <div className="mt-4">
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa, variables: { default: { colors: { brand: '#2e4a3f' } } } }}
            providers={[]}
            view="sign_in"
            redirectTo={siteUrl}
          />
        </div>
      </div>
    </div>
  );
}
