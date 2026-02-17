-- Furniture Purchase Web: migrate item.status values
-- Target statuses: candidate / want / decided / purchased

begin;

-- 1) Map old values (if present)
update public.items
set status = 'decided'
where status = 'eliminated';

-- 2) Recreate constraint
alter table public.items drop constraint if exists items_status_check;
alter table public.items
  add constraint items_status_check
  check (status in ('candidate', 'want', 'decided', 'purchased'));

-- 3) Optional: set default to 'candidate'
alter table public.items alter column status set default 'candidate';

commit;
