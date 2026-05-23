-- 0012_products_total_stock.sql
-- Headline stock figure on `products`.
--
-- Per the original design, real stock lives on product_variants (per
-- size × color). Until the variants editor in the admin UI ships,
-- there's nowhere for the single "stock" number in the product form to
-- land, so every product shows 0 in admin lists.
--
-- This migration adds `total_stock` as a temporary bridge:
--   • The product form writes it on create / update.
--   • The admin list reads it directly.
--   • When variants are wired in the UI, this column becomes the cached
--     sum of product_variants.stock (kept current by a trigger) or is
--     removed in favour of an on-the-fly aggregate.
--
-- Safe to re-run.

alter table public.products
  add column if not exists total_stock integer not null default 0
    check (total_stock >= 0);

comment on column public.products.total_stock is
  'Temporary headline stock figure shown in admin tables. Will be replaced by a sum over product_variants once the variants editor ships.';
