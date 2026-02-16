-- Furniture Purchase Web (MVP)
-- Run this in Supabase SQL Editor.

-- 1) Table
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  room text not null,
  brand text,
  model text,
  price numeric,
  currency text not null default 'TWD',
  url text,
  note text,
  status text not null default 'want',
  purchased_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Basic constraints
alter table public.items
  drop constraint if exists items_status_check;

alter table public.items
  add constraint items_status_check
  check (status in ('want', 'candidate', 'purchased', 'eliminated'));

-- Optional: room constraint (can extend later)
alter table public.items
  drop constraint if exists items_room_check;

alter table public.items
  add constraint items_room_check
  check (room in ('客廳','廚房','電腦房','小房間','主臥室','浴室'));

-- 2) updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_items_updated_at on public.items;
create trigger set_items_updated_at
before update on public.items
for each row
execute function public.set_updated_at();

-- 3) RLS
alter table public.items enable row level security;

-- 4) Policies
-- Public read-only
drop policy if exists "items_public_read" on public.items;
create policy "items_public_read"
  on public.items
  for select
  using (true);

-- Admin write (replace with your admin user id)
-- Admin user id: 2ef2b25b-e4b1-46dd-abee-a5513043ad42

drop policy if exists "items_admin_insert" on public.items;
create policy "items_admin_insert"
  on public.items
  for insert
  with check (auth.uid() = '2ef2b25b-e4b1-46dd-abee-a5513043ad42');

drop policy if exists "items_admin_update" on public.items;
create policy "items_admin_update"
  on public.items
  for update
  using (auth.uid() = '2ef2b25b-e4b1-46dd-abee-a5513043ad42')
  with check (auth.uid() = '2ef2b25b-e4b1-46dd-abee-a5513043ad42');

drop policy if exists "items_admin_delete" on public.items;
create policy "items_admin_delete"
  on public.items
  for delete
  using (auth.uid() = '2ef2b25b-e4b1-46dd-abee-a5513043ad42');

-- 5) Helpful indexes (optional)
create index if not exists items_room_idx on public.items(room);
create index if not exists items_category_idx on public.items(category);
create index if not exists items_status_idx on public.items(status);
create index if not exists items_updated_at_idx on public.items(updated_at desc);
