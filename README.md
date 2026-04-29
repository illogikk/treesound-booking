# TreeSound Booking — Supabase MVP

Next.js (App Router) + Supabase (DB/Auth). Stripe/Xero placeholders.

## Setup
1) `cp .env.example .env.local` and fill:
   - NEXT_PUBLIC_SUPABASE_URL (provided)
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
2) (Optional) apply SQL in Supabase: `supabase/migrations/0001_init.sql` via SQL editor.
3) `npm run dev`.

Vercel: add the same env vars.
