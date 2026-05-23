-- 0006_products.sql
-- Catalog tables.
--
--   products          one row per SKU family ("Peak Lightning VII")
--   product_variants  one row per (product × size × color); holds stock
--
-- Stock lives on the variant, not the product, so "size 42 black" can sell
-- out independently of "size 43 black".
--
-- size is a single text column that holds either a shoe pointure ('36'..'46')
-- or a clothing size ('XS'..'XXL'). The UI uses products.type to decide
-- which size table to render.
--
-- Either size or color_id may be null individually, but not both — the
-- check constraint product_variants_has_axis enforces that.
--
-- Soft delete only: is_active = false hides a product from the shop but
-- preserves order_items.product_id links to history.
--
-- Safe to re-run.

create table if not exists public.products (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text unique not null,
  name                  text not null,
  category              public.product_category not null,
  gender                public.product_gender   not null,
  type                  public.product_type     not null,
  price_cents           integer not null check (price_cents > 0),
  original_price_cents  integer
                        check (
                          original_price_cents is null
                          or original_price_cents >= price_cents
                        ),
  image_path            text not null,
  description           text,
  is_new                boolean not null default false,
  is_active             boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  discount_pct          integer generated always as (
    case
      when original_price_cents is null then null
      else floor(((original_price_cents - price_cents)::numeric / original_price_cents) * 100)::int
    end
  ) stored
);

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.update_updated_at();

create index if not exists products_gender_type_idx
  on public.products (gender, type) where is_active;
create index if not exists products_category_idx
  on public.products (category) where is_active;
create index if not exists products_created_at_idx
  on public.products (created_at desc) where is_active;

alter table public.products enable row level security;

drop policy if exists products_read_active on public.products;
create policy products_read_active on public.products
  for select using (is_active or public.is_admin());

drop policy if exists products_write_admin on public.products;
create policy products_write_admin on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------

create table if not exists public.product_variants (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  size        text,
  color_id    uuid references public.colors(id) on delete restrict,
  sku         text unique,
  image_path  text,
  stock       integer not null default 0 check (stock >= 0),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint product_variants_has_axis
    check (size is not null or color_id is not null)
);

drop trigger if exists product_variants_set_updated_at on public.product_variants;
create trigger product_variants_set_updated_at
  before update on public.product_variants
  for each row execute function public.update_updated_at();

-- One row per (product, size, color). Three partial unique indexes cover
-- the three valid shapes:
--   1. both size and color present  → shoes/apparel with color
--   2. size only, color null        → a belt with no color choice
--   3. color only, size null        → a hat or bag with no size choice
-- The check constraint above already forbids "both null".
create unique index if not exists product_variants_unique_size_color
  on public.product_variants (product_id, size, color_id)
  where size is not null and color_id is not null;

create unique index if not exists product_variants_unique_size_only
  on public.product_variants (product_id, size)
  where size is not null and color_id is null;

create unique index if not exists product_variants_unique_color_only
  on public.product_variants (product_id, color_id)
  where color_id is not null and size is null;

create index if not exists product_variants_product_idx
  on public.product_variants (product_id);
create index if not exists product_variants_color_idx
  on public.product_variants (color_id) where color_id is not null;

alter table public.product_variants enable row level security;

drop policy if exists variants_read_active on public.product_variants;
create policy variants_read_active on public.product_variants
  for select using (
    (
      is_active
      and exists (
        select 1 from public.products p
         where p.id = product_id and p.is_active
      )
    )
    or public.is_admin()
  );

drop policy if exists variants_write_admin on public.product_variants;
create policy variants_write_admin on public.product_variants
  for all using (public.is_admin()) with check (public.is_admin());
