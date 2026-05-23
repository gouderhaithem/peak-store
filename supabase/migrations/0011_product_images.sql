-- 0011_product_images.sql
-- Gallery images per product. `products.image_path` stays as the canonical
-- *primary* image used in cards and listings; this table holds the full
-- ordered gallery (which may include the primary at position 0).
--
-- Access rules:
--   * Anyone can read images of an active product. Admins also see images
--     of inactive products.
--   * Only admins can insert / update / delete.
--
-- Safe to re-run.

create table if not exists public.product_images (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  path        text not null,
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists product_images_product_idx
  on public.product_images (product_id, position);

alter table public.product_images enable row level security;

drop policy if exists product_images_read on public.product_images;
create policy product_images_read on public.product_images
  for select using (
    exists (
      select 1 from public.products p
      where p.id = product_id and (p.is_active or public.is_admin())
    )
  );

drop policy if exists product_images_write_admin on public.product_images;
create policy product_images_write_admin on public.product_images
  for all using (public.is_admin()) with check (public.is_admin());
