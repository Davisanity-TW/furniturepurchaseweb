-- Furniture Purchase Web: add "全區域" as a valid room.
-- Run in Supabase SQL Editor if the items_room_check constraint exists.

begin;

alter table public.items drop constraint if exists items_room_check;

alter table public.items
  add constraint items_room_check
  check (room in ('全區域','客廳','廚房','電腦房','小房間','主臥室','浴室'));

commit;
