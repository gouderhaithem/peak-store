-- 0009_storage.sql
-- The product-images storage bucket. Path format: "<product-slug>/<file>".
-- The app stores the path in products.image_path and composes the public
-- URL at read time, which keeps CDN swaps cheap.
--
-- Public read; admin write.
--
-- Safe to re-run.

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "product-images public read" on storage.objects;
create policy "product-images public read" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "product-images admin write" on storage.objects;
create policy "product-images admin write" on storage.objects
  for all
  using      (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());
