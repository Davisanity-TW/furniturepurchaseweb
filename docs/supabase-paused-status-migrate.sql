-- Furniture Purchase Web: add "暫不考慮" as a valid item status.
-- Run in Supabase SQL Editor if the items_status_check constraint exists.
--
-- Status values:
--   candidate = 候選
--   want      = 想買
--   decided   = 已決定
--   purchased = 已購買
--   paused    = 暫不考慮

alter table public.items drop constraint if exists items_status_check;

alter table public.items
  add constraint items_status_check
  check (status in ('candidate', 'want', 'decided', 'purchased', 'paused'));
