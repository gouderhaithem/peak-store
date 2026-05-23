-- 0005_colors.sql
-- Shared color palette used by product variants. Admins curate this list
-- so the same "Black" swatch appears identical on every product page.
-- Base palette is loaded later in 0010_seed.sql.
--
-- Two hex columns:
--   hex            primary swatch (required)
--   hex_secondary  optional second hex for split swatches like "Black/Red"
--
-- Safe to re-run.

create table if not exists public.colors (
  id             uuid primary key default gen_random_uuid(),
  slug           text unique not null,
  name_fr        text not null,
  name_ar        text,
  hex            text not null
                 check (hex ~ '^#[0-9A-Fa-f]{6}$'),
  hex_secondary  text
                 check (hex_secondary is null or hex_secondary ~ '^#[0-9A-Fa-f]{6}$'),
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

alter table public.colors enable row level security;

-- Everyone reads active colors; admins also see inactive ones for the
-- admin UI.
drop policy if exists colors_read_all on public.colors;
create policy colors_read_all on public.colors
  for select using (is_active or public.is_admin());

drop policy if exists colors_write_admin on public.colors;
create policy colors_write_admin on public.colors
  for all using (public.is_admin()) with check (public.is_admin());
