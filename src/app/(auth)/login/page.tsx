'use client';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createSupabaseBrowser } from '@/lib/supabaseClient';

export default function LoginPage() {
  const supabase = createSupabaseBrowser();
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-900/40 p-6 shadow">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="mt-1 text-sm text-neutral-400">Use your email to receive a magic link.</p>
        <div className="mt-4">
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa, variables: { default: { colors: { brand: '#10b981' } } } }}
            providers={[]}
            view="magic_link"
          />
        </div>
      </div>
    </div>
  );
}
