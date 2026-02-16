-- Furniture Purchase Web: Storage setup (item images)
-- Run in Supabase SQL Editor.

-- 1) Create bucket (public read)
insert into storage.buckets (id, name, public)
values ('item-images', 'item-images', true)
on conflict (id) do update set public = excluded.public;

-- 2) Policies for storage objects
-- Public read
create policy if not exists "item-images public read"
  on storage.objects
  for select
  to public
  using (bucket_id = 'item-images');

-- Admin write
create policy if not exists "item-images admin insert"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'item-images' and auth.uid() = '2ef2b25b-e4b1-46dd-abee-a5513043ad42');

create policy if not exists "item-images admin update"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'item-images' and auth.uid() = '2ef2b25b-e4b1-46dd-abee-a5513043ad42')
  with check (bucket_id = 'item-images' and auth.uid() = '2ef2b25b-e4b1-46dd-abee-a5513043ad42');

create policy if not exists "item-images admin delete"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'item-images' and auth.uid() = '2ef2b25b-e4b1-46dd-abee-a5513043ad42');
