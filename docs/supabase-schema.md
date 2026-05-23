# Peak Store — Supabase Schema & RLS Plan

Design doc, **not** the migration. Each section names the table, the columns, the
indexes, and the RLS policies. Once we agree on this, the next step is to
translate it into `supabase/migrations/*.sql`.

## Design principles

- **`auth.users` is the source of truth for identity.** Everything user-facing
  joins through `profiles.id = auth.users.id`. We never duplicate emails.
- **Customers are derived data, not a table.** What `mockCustomers.ts` calls
  `totalSpent` / `ordersCount` is a `VIEW` over `orders`, so it can never drift.
- **Orders are immutable line snapshots.** `order_items` copies `name` and
  `unit_price` at order time — changing a product's price later must not change
  historical order totals.
- **One source of truth per concept.** Wilayas are a reference table, not an
  enum scattered across the codebase. The TS file becomes a one-time seed.
- **RLS on every table, no exceptions.** Public-readable tables (`products`,
  `wilayas`) get an explicit "anyone can read" policy; everything else is
  owner-or-admin by default.
- **Stock lives on the variant, not the product.** A variant is a `(product ×
  size × color)` triple. "Peak Lightning VII, size 42, black" sells out
  independently of "size 43, black" or "size 42, white".
- **Size is a single text column** that holds either a *pointure* (`'36'..'46'`)
  for shoes or a *clothing size* (`'XS'..'XXL'`) for apparel. The product's
  `type` tells the UI which size table to render. We do **not** split into
  two columns — keeps `order_items.size` simple.
- **Color is a reference table.** Names and hex codes are reused across
  products so swatches stay consistent (a black sneaker and a black tee point
  at the same `colors` row).
- **IDs**: `uuid` primary keys (`gen_random_uuid()`). Human-friendly identifiers
  (`order_number`, product `slug`) are separate columns with unique indexes.

## Conventions

- `snake_case` columns; the repository layer maps to/from camelCase.
- Every table has `created_at timestamptz not null default now()`.
- Mutable tables also have `updated_at timestamptz not null default now()` with
  an `update_updated_at` trigger.
- Foreign keys: `on delete restrict` by default; `on delete cascade` only where
  the child has no meaning without the parent (e.g., `order_items` → `orders`).
- All monetary amounts are `integer` in DZD **centimes** (×100). Avoids float
  drift. Repository converts at the boundary.

---

## Enums

```sql
create type user_role        as enum ('customer', 'admin');
create type product_gender   as enum ('men', 'women', 'kids', 'unisex');
create type product_type     as enum ('running', 'basketball', 'casual', 'training', 'apparel');
create type product_category as enum ('shoes', 'clothing', 'accessories');
create type order_status     as enum ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');
create type payment_method   as enum ('cod');
```

Why enums and not lookup tables? These values change on a yearly cadence at
most and are referenced from TS literal unions. Enums keep them in sync; adding
a value is one `alter type` statement.

---

## Tables

### `profiles`

Extends `auth.users` with app-level fields. Created via a trigger when a new
auth user signs up.

| column          | type            | notes                                   |
|-----------------|-----------------|-----------------------------------------|
| `id`            | `uuid` PK       | = `auth.users.id`, fk on delete cascade |
| `full_name`     | `text` not null | seeded from auth metadata               |
| `role`          | `user_role`     | default `'customer'`, **not user-editable** |
| `phone`         | `text`          | nullable; E.164-ish, validated in app   |
| `avatar_color`  | `text`          | default `'#0A0A0A'`                     |
| `created_at`    | `timestamptz`   |                                         |
| `updated_at`    | `timestamptz`   |                                         |

Trigger: `on auth.users insert → insert into profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)))`.

### `wilayas`

Reference table. Seeded once from `lib/wilayas.ts`.

| column     | type        | notes               |
|------------|-------------|---------------------|
| `code`     | `text` PK   | `'01'..'58'`        |
| `name_fr`  | `text` not null |                 |
| `name_ar`  | `text` not null |                 |

Index: `code` is the PK (string-typed to preserve leading zeros).

### `colors`

Shared color palette. Curated by admins; reused across products so the same
"Black" swatch appears identical on every PDP.

| column         | type                | notes                                  |
|----------------|---------------------|----------------------------------------|
| `id`           | `uuid` PK           |                                        |
| `slug`         | `text` unique not null | url-safe (`'black'`, `'royal-blue'`) |
| `name_fr`      | `text` not null     | display name in French                 |
| `name_ar`      | `text`              | optional Arabic name                   |
| `hex`          | `text` not null     | `'#RRGGBB'`, validated by check        |
| `is_active`    | `boolean` not null default true |                            |
| `created_at`   | `timestamptz`       |                                        |

Constraint: `check (hex ~ '^#[0-9A-Fa-f]{6}$')`.

For two-tone colors (e.g., "Black/Red"), we keep it simple: add a second
column `hex_secondary text` (nullable). The UI renders a split swatch when
present.

### `products`

| column           | type               | notes                              |
|------------------|--------------------|------------------------------------|
| `id`             | `uuid` PK          |                                    |
| `slug`           | `text` unique not null | url-safe, used for routes       |
| `name`           | `text` not null    |                                    |
| `category`       | `product_category` not null |                           |
| `gender`         | `product_gender`   not null |                           |
| `type`           | `product_type`     not null |                           |
| `price_cents`    | `integer` not null check (price_cents > 0) |          |
| `original_price_cents` | `integer` check (original_price_cents is null or original_price_cents >= price_cents) | for sale comparisons |
| `image_path`     | `text` not null    | path in `product-images` bucket    |
| `description`    | `text`             |                                    |
| `is_new`         | `boolean` not null default false |                      |
| `is_active`      | `boolean` not null default true  | soft delete           |
| `created_at`     | `timestamptz`      |                                    |
| `updated_at`     | `timestamptz`      |                                    |

Indexes:

```sql
create index products_gender_type_idx on products (gender, type) where is_active;
create index products_category_idx    on products (category)     where is_active;
create index products_created_at_idx  on products (created_at desc) where is_active;
```

Generated column for discount %, to avoid drift in UI:

```sql
discount_pct integer generated always as (
  case
    when original_price_cents is null then null
    else floor(((original_price_cents - price_cents)::numeric / original_price_cents) * 100)::int
  end
) stored;
```

### `product_variants`

A row per `(product × size × color)`. Either `size` or `color_id` may be null
(but not both — see check constraint) so we can still represent:

- shoes/apparel with both: `size = '42'`, `color_id = <black>`
- color-only items (a hat, a strapless bag): `size = null`, `color_id = <red>`
- size-only items (a belt with no color choice): `size = '90'`, `color_id = null`

| column           | type            | notes                                          |
|------------------|-----------------|------------------------------------------------|
| `id`             | `uuid` PK       |                                                |
| `product_id`     | `uuid` not null fk products(id) on delete cascade |                            |
| `size`           | `text`          | pointure (`'36'..'46'`) or clothing size (`'XS'..'XXL'`); nullable |
| `color_id`       | `uuid` fk colors(id) on delete restrict | nullable               |
| `sku`            | `text` unique   | optional human/admin-facing code               |
| `image_path`     | `text`          | nullable; falls back to `products.image_path`. Different colors usually have different photos. |
| `stock`          | `integer` not null default 0 check (stock >= 0) |                            |
| `is_active`      | `boolean` not null default true |                                |
| `created_at`     | `timestamptz`   |                                                |
| `updated_at`     | `timestamptz`   |                                                |

Constraints:

```sql
-- one row per (product, size, color); nulls are treated as equal by an
-- expression-based unique index because Postgres unique by default treats
-- nulls as distinct (which would allow duplicates).
create unique index product_variants_unique
  on product_variants (product_id, coalesce(size, ''), coalesce(color_id::text, ''));

-- at least one of size / color must be present
alter table product_variants
  add constraint product_variants_has_axis
  check (size is not null or color_id is not null);

create index product_variants_product_idx on product_variants (product_id);
create index product_variants_color_idx   on product_variants (color_id) where color_id is not null;
```

**Why both can be null in the column but not in the row.** Some products vary
only by size (a belt), some only by color (a beanie). Forcing both columns
non-null would mean inventing fake "one size" / "no color" sentinel rows in
the reference tables, which makes filtering noisy. The check constraint
guarantees every variant has *at least one* differentiating axis.

### `orders`

| column           | type             | notes                                              |
|------------------|------------------|----------------------------------------------------|
| `id`             | `uuid` PK        |                                                    |
| `order_number`   | `text` unique not null | `PEAK-YYMMDD-XXXX`, generated by trigger     |
| `user_id`        | `uuid` fk profiles(id) on delete set null | nullable for guest COD          |
| `status`         | `order_status` not null default `'pending'` |                         |
| `payment_method` | `payment_method` not null default `'cod'` |                           |
| `subtotal_cents` | `integer` not null check (subtotal_cents >= 0) | computed from items     |
| **shipping snapshot** |             | denormalized so customer info can't change post-order |
| `ship_full_name` | `text` not null  |                                                    |
| `ship_phone`     | `text` not null  |                                                    |
| `ship_wilaya`    | `text` not null fk wilayas(code) |                                  |
| `ship_commune`   | `text` not null  |                                                    |
| `ship_address`   | `text` not null  |                                                    |
| `ship_note`      | `text`           |                                                    |
| `created_at`     | `timestamptz`    |                                                    |
| `updated_at`     | `timestamptz`    |                                                    |

Order number generation:

```sql
create sequence orders_daily_seq;

create or replace function gen_order_number() returns trigger as $$
declare
  stamp text := to_char(now() at time zone 'UTC', 'YYMMDD');
  n     int  := nextval('orders_daily_seq');
begin
  new.order_number := 'PEAK-' || stamp || '-' || lpad((n % 10000)::text, 4, '0');
  return new;
end $$ language plpgsql;

create trigger orders_set_number before insert on orders
  for each row when (new.order_number is null) execute function gen_order_number();
```

Indexes:

```sql
create index orders_user_idx       on orders (user_id, created_at desc);
create index orders_status_idx     on orders (status)        where status <> 'delivered';
create index orders_created_at_idx on orders (created_at desc);
```

### `order_items`

Append-only line-item snapshot.

| column           | type             | notes                                      |
|------------------|------------------|--------------------------------------------|
| `id`             | `uuid` PK        |                                            |
| `order_id`       | `uuid` not null fk orders(id) on delete cascade |                     |
| `product_id`     | `uuid` fk products(id) on delete set null | survives product deletion       |
| `variant_id`     | `uuid` fk product_variants(id) on delete set null |                       |
| `product_name`   | `text` not null  | snapshot                                   |
| `size`           | `text`           | snapshot (nullable for color-only variants)|
| `color_name`     | `text`           | snapshot of `colors.name_fr` (nullable)    |
| `color_hex`      | `text`           | snapshot of `colors.hex` so receipts/emails can render the swatch even if the color is later deleted |
| `unit_price_cents` | `integer` not null check (unit_price_cents > 0) | snapshot           |
| `quantity`       | `integer` not null check (quantity > 0)    |                                |
| `created_at`     | `timestamptz`    |                                            |

Index: `create index order_items_order_idx on order_items (order_id);`

### `customer_summary` (VIEW)

Replaces the `MockCustomer` row. Always consistent with `orders`.

```sql
create view customer_summary as
select
  p.id,
  p.full_name,
  u.email,
  p.phone,
  p.avatar_color,
  p.created_at as joined_at,
  -- derived from orders
  coalesce(count(o.id) filter (where o.status <> 'cancelled'), 0)             as orders_count,
  coalesce(sum(o.subtotal_cents) filter (where o.status <> 'cancelled'), 0)   as total_spent_cents,
  mode() within group (order by o.ship_wilaya)                                as preferred_wilaya
from profiles p
join auth.users u on u.id = p.id
left join orders o on o.user_id = p.id
group by p.id, u.email;
```

The view inherits the RLS of its base tables, so callers see only their own
row unless they're admin (see policies below).

---

## RLS policies

Enable RLS on every table:

```sql
alter table profiles         enable row level security;
alter table wilayas          enable row level security;
alter table colors           enable row level security;
alter table products         enable row level security;
alter table product_variants enable row level security;
alter table orders           enable row level security;
alter table order_items      enable row level security;
```

Helper function — single source of truth for "is this caller an admin?":

```sql
create or replace function is_admin() returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;
```

`security definer` is required so the function can read `profiles` even when
the policy that calls it would otherwise block the read.

### `profiles`

```sql
-- read your own row
create policy profiles_select_self on profiles
  for select using (auth.uid() = id);

-- admin sees all
create policy profiles_select_admin on profiles
  for select using (is_admin());

-- update your own row (NOT role)
create policy profiles_update_self on profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from profiles where id = auth.uid()));

-- admin can update anyone (incl. role)
create policy profiles_update_admin on profiles
  for update using (is_admin()) with check (is_admin());
```

No `insert` policy — rows are created exclusively by the auth trigger.
No `delete` — cascade from `auth.users` handles it.

### `wilayas`

```sql
create policy wilayas_read_all on wilayas for select using (true);
-- writes: admin only
create policy wilayas_write_admin on wilayas for all using (is_admin()) with check (is_admin());
```

### `colors`

```sql
create policy colors_read_all on colors for select using (is_active or is_admin());
create policy colors_write_admin on colors for all using (is_admin()) with check (is_admin());
```

### `products` & `product_variants`

```sql
-- public can read active products
create policy products_read_active on products
  for select using (is_active or is_admin());

create policy products_write_admin on products
  for all using (is_admin()) with check (is_admin());

create policy variants_read_active on product_variants
  for select using (
    is_active and exists (select 1 from products p where p.id = product_id and p.is_active)
    or is_admin()
  );

create policy variants_write_admin on product_variants
  for all using (is_admin()) with check (is_admin());
```

### `orders` & `order_items`

```sql
-- read your own orders
create policy orders_select_own on orders
  for select using (auth.uid() is not null and user_id = auth.uid());

-- admin sees all
create policy orders_select_admin on orders
  for select using (is_admin());

-- insert: authenticated users insert with their own user_id, OR anonymous
-- guest checkout (user_id is null). Lock down via a CHECK that user_id is
-- either null or equals auth.uid().
create policy orders_insert_self_or_guest on orders
  for insert with check (user_id is null or user_id = auth.uid());

-- only admin can change status or shipping
create policy orders_update_admin on orders
  for update using (is_admin()) with check (is_admin());

-- order_items: visible iff parent order is
create policy order_items_select on order_items
  for select using (
    exists (
      select 1 from orders o
      where o.id = order_id
        and (o.user_id = auth.uid() or is_admin())
    )
  );

-- insert: same caller that inserted the parent order
create policy order_items_insert on order_items
  for insert with check (
    exists (
      select 1 from orders o
      where o.id = order_id
        and (o.user_id is null or o.user_id = auth.uid() or is_admin())
    )
  );

create policy order_items_update_admin on order_items
  for update using (is_admin()) with check (is_admin());
```

Guest checkout note: we accept `user_id is null` so COD without an account
keeps working. We rely on the **app server** (not RLS) to verify the rate
limit and re-check the cart subtotal before insert; RLS alone can't stop
someone from spamming guest orders.

---

## Storage

One public-read bucket: `product-images`.

```sql
insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true);

-- anyone can read
create policy "product-images public read" on storage.objects
  for select using (bucket_id = 'product-images');

-- only admin can write/delete
create policy "product-images admin write" on storage.objects
  for all using (bucket_id = 'product-images' and is_admin())
  with check (bucket_id = 'product-images' and is_admin());
```

`products.image_path` stores the object path (`'lightning-vii/main.webp'`),
not the full URL. The repository builds the public URL at read time, which
makes CDN swaps free.

---

## Triggers & functions checklist

- `update_updated_at()` generic trigger applied to all mutable tables.
- `gen_order_number()` before-insert on `orders`.
- `handle_new_auth_user()` after-insert on `auth.users` → row in `profiles`.
- `compute_order_subtotal()` after-insert/update/delete on `order_items` →
  refresh `orders.subtotal_cents`. (Avoids the app and DB disagreeing on the
  total.)
- `decrement_stock_on_confirm()` before-update on `orders` when
  `old.status = 'pending' and new.status = 'confirmed'` — atomic
  decrement of `product_variants.stock`, rolls back if any line is out
  of stock.
- `restore_stock_on_cancel()` before-update on `orders` when
  `old.status = 'confirmed' and new.status = 'cancelled'` — adds quantities
  back to `product_variants.stock`.
- `is_admin()` as above.

---

## Migration ordering

The migration file order matters because policies reference `is_admin()`,
which reads `profiles`.

1. `0001_enums.sql` — types only.
2. `0002_profiles.sql` — table + auth trigger + RLS.
3. `0003_is_admin.sql` — helper function.
4. `0004_wilayas.sql` — table + seed + RLS.
5. `0005_colors.sql` — table + seed (Black, White, Red, Royal Blue, …) + RLS.
6. `0006_products.sql` — products, variants (with `color_id`), RLS.
7. `0007_orders.sql` — orders, order_items (with color snapshot), triggers, RLS.
8. `0008_views.sql` — `customer_summary`.
9. `0009_storage.sql` — bucket + policies.
10. `0010_seed.sql` — dev seed (products + variants per size×color + one admin).

---

## Mapping back to the repository interfaces

So we can confirm nothing in the repo changes shape:

| repo method                     | implementation                                       |
|---------------------------------|------------------------------------------------------|
| `productsRepo.list(filters)`    | `select … from products where is_active …` + filters |
| `productsRepo.findById(id)`     | `select … from products where id = $1`               |
| `productsRepo.findManyByIds`    | `where id = any($1)`, preserve input order in JS     |
| `productsRepo.listFeatured`     | `where is_active and (is_new or created_at > now() - interval '30 days') order by created_at desc limit n` |
| `productsRepo.getSizeOptions`   | `select size from product_variants where product_id = $1 and is_active` |
| `ordersRepo.create(input)`      | tx: insert `orders` + N `order_items`                |
| `ordersRepo.listMine`           | `where user_id = auth.uid()` (RLS makes the WHERE optional but keep it for index) |
| `ordersRepo.list` (admin)       | full table, RLS lets only admins through             |
| `ordersRepo.updateStatus`       | `update orders set status = $2 where id = $1`        |
| `customersRepo.list`            | `select * from customer_summary` + filters           |

Notable shape changes the repo will absorb (UI stays the same):

- `Product.price` (today: DZD as integer) ↔ `price_cents`. The repo divides
  by 100 on read and multiplies on write.
- `Product.image` (full URL) ↔ `image_path`. The repo composes the public URL.
- `Product.discount` is replaced by the generated `discount_pct` column.
- `OrderRecord.id` (today: `PEAK-YYMMDD-XXXX`) → `order_number`. The repo
  still exposes `id` to the UI by returning `order_number` as `id`. Internal
  joins use the `uuid`.

---

## Decisions

1. **Featured products — derived.** No `is_featured` column. `listFeatured`
   query: `where is_active and (is_new or created_at > now() - interval
   '30 days') order by created_at desc limit n`. Revisit if we ever want
   editorial control over the homepage carousel.
2. **Lifestyle sections — code.** `lifestyleSections` stays in
   `lib/mockdata.ts` (or a renamed `lib/cms.ts`). No `cms_sections` table
   until a non-engineer needs to edit the homepage.
3. **Guest order rate limiting — deferred.** No Edge Function or Turnstile
   for now. RLS still accepts `user_id is null` for COD; we accept the
   spam risk in v1. Revisit before public launch.
4. **Stock reservation — on confirm.** Stock is **not** decremented when an
   order is created (`pending`). It decrements atomically when an admin
   transitions an order from `pending` → `confirmed`. This avoids holding
   stock for abandoned COD orders.
   - Implementation: a `before update` trigger on `orders` that fires only
     when `old.status = 'pending' and new.status = 'confirmed'`, then for
     each row in `order_items` runs `update product_variants set stock =
     stock - oi.quantity where id = oi.variant_id and stock >= oi.quantity
     returning id`. If any update returns zero rows, the trigger raises and
     the status change is rolled back. The admin sees "out of stock — order
     stays pending".
   - On `confirmed → cancelled`, a second trigger restores stock.
   - The product listing query stays naive (`stock > 0` checks against the
     current value); two customers can both checkout the last unit, and the
     second one fails at admin confirm. Acceptable for COD.
5. **Soft delete for products — confirmed.** `is_active = false` hides the
   product from the shop but preserves `order_items.product_id` so
   historical orders stay linked. No hard delete from the admin UI.

This doc is now the source for the migration files in step 2.
