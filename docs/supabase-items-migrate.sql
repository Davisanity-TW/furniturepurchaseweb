-- Furniture Purchase Web: items table migration for image support
-- Run in Supabase SQL Editor.

alter table public.items
  add column if not exists image_path text;
