'use client';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createSupabaseBrowser } from '@/lib/supabaseClient';

export default function LoginPage() {
  const supabase = createSupabaseBrowser();
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-4">Sign in</h1>
        <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} providers={[]} view="magic_link" />
      </div>
    </div>
  );
}
