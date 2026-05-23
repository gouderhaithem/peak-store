-- 0004_wilayas.sql
-- Reference table for the 58 Algerian wilayas (provinces).
-- The code is the PK, stored as text to preserve leading zeros ("01" not 1).
-- Data is loaded later in 0010_seed.sql.
--
-- Read-only for the public; admin-only for writes.
--
-- Safe to re-run.

create table if not exists public.wilayas (
  code     text primary key,
  name_fr  text not null,
  name_ar  text not null
);

alter table public.wilayas enable row level security;

drop policy if exists wilayas_read_all on public.wilayas;
create policy wilayas_read_all on public.wilayas
  for select using (true);

drop policy if exists wilayas_write_admin on public.wilayas;
create policy wilayas_write_admin on public.wilayas
  for all using (public.is_admin()) with check (public.is_admin());
