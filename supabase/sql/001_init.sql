-- Rooms and bookings schema (MVP)
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  hourly_rate_cents integer not null check (hourly_rate_cents > 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid references auth.users(id),
  status text not null default 'pending' check (status in ('pending','held','paid','cancelled')),
  start_ts timestamptz not null,
  end_ts timestamptz not null,
  total_cents integer not null,
  square_payment_id text,
  square_checkout_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.bookings enable row level security;
alter table public.rooms enable row level security;

-- Rooms readable by anyone
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='rooms' and policyname='rooms_select_all'
  ) then
    create policy rooms_select_all on public.rooms for select using (true);
  end if;
end $$;

-- Bookings policies: owner can select/insert; admins can manage via role
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='bookings' and policyname='bookings_select_own'
  ) then
    create policy bookings_select_own on public.bookings for select using (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='bookings' and policyname='bookings_insert_own'
  ) then
    create policy bookings_insert_own on public.bookings for insert with check (auth.uid() = user_id);
  end if;
end $$;

-- Basic index for availability lookups
create index if not exists bookings_room_time_idx on public.bookings(room_id, start_ts, end_ts);

-- Seed example rooms (safe-upsert by slug)
insert into public.rooms (name, slug, description, hourly_rate_cents)
values
  ('Studio A', 'studio-a', 'Flagship recording room', 15000),
  ('Studio B', 'studio-b', 'Production room', 10000)
on conflict (slug) do nothing;

