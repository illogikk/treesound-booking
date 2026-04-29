create extension if not exists pgcrypto;

create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  tz text not null default 'America/New_York',
  created_at timestamptz default now()
);

create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  location_id uuid references locations(id) on delete cascade,
  name text not null,
  type text not null,
  capacity int,
  created_at timestamptz default now()
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  room_id uuid not null references rooms(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text not null default 'pending',
  price_cents int not null default 0,
  currency text not null default 'USD',
  created_at timestamptz default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  provider text not null default 'stripe',
  provider_ref text,
  amount_cents int not null,
  status text not null,
  created_at timestamptz default now()
);

alter table rooms enable row level security;
alter table bookings enable row level security;
create policy "public read rooms" on rooms for select using (true);
create policy "user read own bookings" on bookings for select using (auth.uid() = user_id);
create policy "user write own bookings" on bookings for insert with check (auth.uid() = user_id);
