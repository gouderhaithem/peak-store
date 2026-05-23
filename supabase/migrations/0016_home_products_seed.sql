-- 0016_home_products_seed.sql
-- Starter catalog products for the homepage product sections.
--
-- The homepage now reads its lifestyle product rows from `products`, not from
-- mock data. These rows give the hero/lifestyle sections real Supabase
-- products immediately; admins can edit names, prices, images, and stock
-- later from the admin product screens.
--
-- Safe to re-run. Existing products/images/variants are left untouched.

with seed_products (
  id, slug, name, category, gender, type, price_cents, original_price_cents,
  image_path, description, is_new, is_active
) as (
  values
    ('10000000-0000-4000-8000-000000000001'::uuid, 'home-peak-hoodie-pro', 'Peak Hoodie Pro', 'clothing'::public.product_category, 'men'::public.product_gender, 'apparel'::public.product_type, 595000, 850000, 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=1000&q=80', 'Premium fleece hoodie for training, travel, and everyday wear.', true, true),
    ('10000000-0000-4000-8000-000000000002'::uuid, 'home-peak-essential-tee', 'Peak Essential Tee', 'clothing'::public.product_category, 'unisex'::public.product_gender, 'apparel'::public.product_type, 320000, null, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1000&q=80', 'Lightweight cotton-blend tee with a clean athletic cut.', true, true),
    ('10000000-0000-4000-8000-000000000003'::uuid, 'home-peak-court-jersey', 'Peak Court Jersey', 'clothing'::public.product_category, 'men'::public.product_gender, 'apparel'::public.product_type, 480000, null, 'https://images.unsplash.com/photo-1577212017184-80cc0da11082?w=1000&q=80', 'Breathable basketball jersey built for court sessions.', true, true),
    ('10000000-0000-4000-8000-000000000004'::uuid, 'home-peak-wind-jacket', 'Peak Wind Jacket', 'clothing'::public.product_category, 'women'::public.product_gender, 'apparel'::public.product_type, 890000, null, 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=1000&q=80', 'Light woven jacket for warmups and daily movement.', true, true),

    ('10000000-0000-4000-8000-000000000005'::uuid, 'home-peak-velocity-runner', 'Peak Velocity Runner', 'shoes'::public.product_category, 'men'::public.product_gender, 'running'::public.product_type, 1350000, null, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1000&q=80', 'Responsive running shoe for road miles and interval work.', true, true),
    ('10000000-0000-4000-8000-000000000006'::uuid, 'home-peak-court-master', 'Peak Court Master', 'shoes'::public.product_category, 'men'::public.product_gender, 'basketball'::public.product_type, 1480000, null, 'https://images.unsplash.com/photo-1597248881519-db089d3744a5?w=1000&q=80', 'Stable basketball shoe with court-ready grip and support.', true, true),
    ('10000000-0000-4000-8000-000000000007'::uuid, 'home-peak-performance-trainer', 'Peak Performance Trainer', 'shoes'::public.product_category, 'unisex'::public.product_gender, 'training'::public.product_type, 1120000, null, 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=1000&q=80', 'Versatile trainer for gym sessions and everyday conditioning.', true, true),
    ('10000000-0000-4000-8000-000000000008'::uuid, 'home-peak-speed-runner', 'Peak Speed Runner', 'shoes'::public.product_category, 'women'::public.product_gender, 'running'::public.product_type, 1080000, 1350000, 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=1000&q=80', 'Lightweight runner with a fast, low-profile feel.', true, true),

    ('10000000-0000-4000-8000-000000000009'::uuid, 'home-peak-kids-runner', 'Peak Kids Runner', 'shoes'::public.product_category, 'kids'::public.product_gender, 'running'::public.product_type, 750000, null, 'https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=1000&q=80', 'Durable kids running shoe for school and sport.', true, true),
    ('10000000-0000-4000-8000-000000000010'::uuid, 'home-peak-kids-hoodie', 'Peak Kids Hoodie', 'clothing'::public.product_category, 'kids'::public.product_gender, 'apparel'::public.product_type, 420000, null, 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=1000&q=80', 'Soft hoodie sized for young athletes.', true, true),
    ('10000000-0000-4000-8000-000000000011'::uuid, 'home-peak-junior-court', 'Peak Junior Court', 'shoes'::public.product_category, 'kids'::public.product_gender, 'basketball'::public.product_type, 820000, null, 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=1000&q=80', 'Junior basketball shoe with supportive everyday comfort.', true, true),
    ('10000000-0000-4000-8000-000000000012'::uuid, 'home-peak-kids-tee', 'Peak Kids Tee', 'clothing'::public.product_category, 'kids'::public.product_gender, 'apparel'::public.product_type, 260000, null, 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=1000&q=80', 'Easy cotton tee for school days and practice.', true, true),

    ('10000000-0000-4000-8000-000000000013'::uuid, 'home-peak-classic-low', 'Peak Classic Low', 'shoes'::public.product_category, 'unisex'::public.product_gender, 'casual'::public.product_type, 840000, 1200000, 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=1000&q=80', 'Low-profile lifestyle sneaker with clean everyday styling.', true, true),
    ('10000000-0000-4000-8000-000000000014'::uuid, 'home-peak-street-sport', 'Peak Street Sport', 'shoes'::public.product_category, 'men'::public.product_gender, 'casual'::public.product_type, 735000, 1050000, 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=1000&q=80', 'Street-ready sport sneaker with cushioned comfort.', true, true),
    ('10000000-0000-4000-8000-000000000015'::uuid, 'home-peak-urban-trainer', 'Peak Urban Trainer', 'shoes'::public.product_category, 'women'::public.product_gender, 'training'::public.product_type, 686000, 980000, 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=1000&q=80', 'Training-inspired sneaker for active days.', true, true),
    ('10000000-0000-4000-8000-000000000016'::uuid, 'home-peak-aero-run', 'Peak Aero Run', 'shoes'::public.product_category, 'men'::public.product_gender, 'running'::public.product_type, 784000, 1120000, 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=1000&q=80', 'Sale runner with breathable comfort and reliable grip.', true, true)
)
insert into public.products (
  id, slug, name, category, gender, type, price_cents, original_price_cents,
  image_path, description, is_new, is_active
)
select
  id, slug, name, category, gender, type, price_cents, original_price_cents,
  image_path, description, is_new, is_active
from seed_products
on conflict (slug) do nothing;

with seed_images (slug, path, position) as (
  values
    ('home-peak-hoodie-pro', 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=1000&q=80', 0),
    ('home-peak-essential-tee', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1000&q=80', 0),
    ('home-peak-court-jersey', 'https://images.unsplash.com/photo-1577212017184-80cc0da11082?w=1000&q=80', 0),
    ('home-peak-wind-jacket', 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=1000&q=80', 0),
    ('home-peak-velocity-runner', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1000&q=80', 0),
    ('home-peak-court-master', 'https://images.unsplash.com/photo-1597248881519-db089d3744a5?w=1000&q=80', 0),
    ('home-peak-performance-trainer', 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=1000&q=80', 0),
    ('home-peak-speed-runner', 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=1000&q=80', 0),
    ('home-peak-kids-runner', 'https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=1000&q=80', 0),
    ('home-peak-kids-hoodie', 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=1000&q=80', 0),
    ('home-peak-junior-court', 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=1000&q=80', 0),
    ('home-peak-kids-tee', 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=1000&q=80', 0),
    ('home-peak-classic-low', 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=1000&q=80', 0),
    ('home-peak-street-sport', 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=1000&q=80', 0),
    ('home-peak-urban-trainer', 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=1000&q=80', 0),
    ('home-peak-aero-run', 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=1000&q=80', 0)
)
insert into public.product_images (product_id, path, position)
select p.id, si.path, si.position
from seed_images si
join public.products p on p.slug = si.slug
where not exists (
  select 1
  from public.product_images pi
  where pi.product_id = p.id and pi.position = si.position and pi.path = si.path
);

with seed_variants (slug, size, color_slug, stock) as (
  values
    ('home-peak-hoodie-pro', 'S', 'black', 6), ('home-peak-hoodie-pro', 'M', 'black', 8), ('home-peak-hoodie-pro', 'L', 'black', 8), ('home-peak-hoodie-pro', 'XL', 'black', 5),
    ('home-peak-essential-tee', 'S', 'white', 10), ('home-peak-essential-tee', 'M', 'white', 12), ('home-peak-essential-tee', 'L', 'white', 12), ('home-peak-essential-tee', 'XL', 'white', 8),
    ('home-peak-court-jersey', 'M', 'red', 7), ('home-peak-court-jersey', 'L', 'red', 9), ('home-peak-court-jersey', 'XL', 'red', 6),
    ('home-peak-wind-jacket', 'S', 'grey', 5), ('home-peak-wind-jacket', 'M', 'grey', 7), ('home-peak-wind-jacket', 'L', 'grey', 5),

    ('home-peak-velocity-runner', '40', 'black', 4), ('home-peak-velocity-runner', '41', 'black', 6), ('home-peak-velocity-runner', '42', 'black', 6), ('home-peak-velocity-runner', '43', 'black', 4),
    ('home-peak-court-master', '40', 'royal-blue', 4), ('home-peak-court-master', '41', 'royal-blue', 5), ('home-peak-court-master', '42', 'royal-blue', 5), ('home-peak-court-master', '43', 'royal-blue', 3),
    ('home-peak-performance-trainer', '39', 'grey', 5), ('home-peak-performance-trainer', '40', 'grey', 7), ('home-peak-performance-trainer', '41', 'grey', 6), ('home-peak-performance-trainer', '42', 'grey', 5),
    ('home-peak-speed-runner', '37', 'white', 4), ('home-peak-speed-runner', '38', 'white', 6), ('home-peak-speed-runner', '39', 'white', 6), ('home-peak-speed-runner', '40', 'white', 4),

    ('home-peak-kids-runner', '32', 'red', 5), ('home-peak-kids-runner', '33', 'red', 6), ('home-peak-kids-runner', '34', 'red', 6), ('home-peak-kids-runner', '35', 'red', 4),
    ('home-peak-kids-hoodie', '6', 'royal-blue', 5), ('home-peak-kids-hoodie', '8', 'royal-blue', 6), ('home-peak-kids-hoodie', '10', 'royal-blue', 6), ('home-peak-kids-hoodie', '12', 'royal-blue', 4),
    ('home-peak-junior-court', '32', 'black', 4), ('home-peak-junior-court', '33', 'black', 5), ('home-peak-junior-court', '34', 'black', 5), ('home-peak-junior-court', '35', 'black', 3),
    ('home-peak-kids-tee', '6', 'white', 7), ('home-peak-kids-tee', '8', 'white', 8), ('home-peak-kids-tee', '10', 'white', 8), ('home-peak-kids-tee', '12', 'white', 6),

    ('home-peak-classic-low', '40', 'white', 5), ('home-peak-classic-low', '41', 'white', 6), ('home-peak-classic-low', '42', 'white', 6), ('home-peak-classic-low', '43', 'white', 4),
    ('home-peak-street-sport', '40', 'beige', 4), ('home-peak-street-sport', '41', 'beige', 5), ('home-peak-street-sport', '42', 'beige', 5), ('home-peak-street-sport', '43', 'beige', 3),
    ('home-peak-urban-trainer', '37', 'grey', 4), ('home-peak-urban-trainer', '38', 'grey', 5), ('home-peak-urban-trainer', '39', 'grey', 5), ('home-peak-urban-trainer', '40', 'grey', 3),
    ('home-peak-aero-run', '40', 'black', 5), ('home-peak-aero-run', '41', 'black', 5), ('home-peak-aero-run', '42', 'black', 4), ('home-peak-aero-run', '43', 'black', 3)
)
insert into public.product_variants (product_id, size, color_id, sku, stock, is_active)
select
  p.id,
  sv.size,
  c.id,
  upper(replace(sv.slug, 'home-peak-', 'HP-')) || '-' || sv.size || '-' || upper(sv.color_slug),
  sv.stock,
  true
from seed_variants sv
join public.products p on p.slug = sv.slug
join public.colors c on c.slug = sv.color_slug
where not exists (
  select 1
  from public.product_variants pv
  where pv.product_id = p.id
    and pv.size is not distinct from sv.size
    and pv.color_id is not distinct from c.id
);
