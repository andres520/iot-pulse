-- ============================================================
-- IoT Pulse — Supabase schema + seed data
-- Run this in: Supabase Dashboard -> SQL Editor -> New query
-- ============================================================

-- ---------- Tables ----------
create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  location text not null,
  status text not null default 'online' check (status in ('online','offline','maintenance')),
  created_at timestamptz not null default now()
);

create table if not exists public.readings (
  id bigint generated always as identity primary key,
  device_id uuid not null references public.devices(id) on delete cascade,
  temperature double precision not null,
  vibration double precision not null,
  power double precision not null,
  created_at timestamptz not null default now()
);

create index if not exists readings_device_time_idx
  on public.readings (device_id, created_at desc);
create index if not exists readings_time_idx
  on public.readings (created_at desc);

create table if not exists public.alerts (
  id bigint generated always as identity primary key,
  device_id uuid not null references public.devices(id) on delete cascade,
  metric text not null,
  value double precision not null,
  threshold double precision not null,
  status text not null default 'open' check (status in ('open','acknowledged')),
  created_at timestamptz not null default now()
);

create index if not exists alerts_status_idx on public.alerts (status, created_at desc);

-- ---------- Row Level Security ----------
-- Logged-in users can READ everything and ACK alerts.
-- Writes of telemetry happen only from the Cloudflare Worker
-- using the service_role key (bypasses RLS by design).
alter table public.devices  enable row level security;
alter table public.readings enable row level security;
alter table public.alerts   enable row level security;

create policy "authenticated can read devices"
  on public.devices for select to authenticated using (true);

create policy "authenticated can read readings"
  on public.readings for select to authenticated using (true);

create policy "authenticated can read alerts"
  on public.alerts for select to authenticated using (true);

create policy "authenticated can acknowledge alerts"
  on public.alerts for update to authenticated
  using (true) with check (status in ('open','acknowledged'));

-- ---------- Seed: demo fleet ----------
insert into public.devices (id, name, type, location, status) values
  ('11111111-1111-1111-1111-111111111111', 'Compressor A1', 'compressor', 'Plant 1 — Medellin', 'online'),
  ('22222222-2222-2222-2222-222222222222', 'CNC Mill B2',   'cnc',        'Plant 1 — Medellin', 'online'),
  ('33333333-3333-3333-3333-333333333333', 'Conveyor C3',   'conveyor',   'Plant 2 — Bogota',   'online'),
  ('44444444-4444-4444-4444-444444444444', 'Pump D4',       'pump',       'Plant 2 — Bogota',   'maintenance'),
  ('55555555-5555-5555-5555-555555555555', 'Robot Arm E5',  'robot',      'Plant 1 — Medellin', 'online')
on conflict (id) do nothing;

-- ---------- Seed: last hour of readings (1 per minute per device) ----------
insert into public.readings (device_id, temperature, vibration, power, created_at)
select
  d.id,
  round((55 + random() * 20)::numeric, 1),          -- 55–75 °C
  round((1 + random() * 4)::numeric, 2),            -- 1–5 mm/s
  round((800 + random() * 700)::numeric, 0),        -- 800–1500 W
  now() - (m || ' minutes')::interval
from public.devices d
cross join generate_series(0, 59) as m;

-- ---------- Seed: one open alert ----------
insert into public.alerts (device_id, metric, value, threshold)
values ('22222222-2222-2222-2222-222222222222', 'temperature', 82.4, 80);
