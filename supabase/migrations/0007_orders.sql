-- 0007_orders.sql
-- Orders and their line items.
--
-- Two design rules that matter:
--   1. order_items snapshot product_name, size, color, unit_price_cents at
--      order time. Changing a product later must NOT change historical totals.
--   2. Stock decrements when an admin confirms a pending order
--      (pending → confirmed), not at order create time. This avoids holding
--      inventory for abandoned COD orders. Stock is restored if a confirmed
--      order is later cancelled.
--
-- Safe to re-run.

create table if not exists public.orders (
  id              uuid primary key default gen_random_uuid(),
  order_number    text unique not null,
  user_id         uuid references public.profiles(id) on delete set null,
  status          public.order_status   not null default 'pending',
  payment_method  public.payment_method not null default 'cod',
  subtotal_cents  integer not null default 0 check (subtotal_cents >= 0),
  -- shipping snapshot — denormalized so the customer's profile changing
  -- after the fact can never alter an order's delivery details
  ship_full_name  text not null,
  ship_phone      text not null,
  ship_wilaya     text not null references public.wilayas(code),
  ship_commune    text not null,
  ship_address    text not null,
  ship_note       text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.update_updated_at();

-- Sequence used by gen_order_number(). One sequence even though we slice
-- by day in the format string — modulo 10 000 wraps the suffix.
create sequence if not exists public.orders_daily_seq;

-- Builds the customer-facing PEAK-YYMMDD-NNNN order number.
create or replace function public.gen_order_number()
returns trigger
language plpgsql
as $$
declare
  stamp text := to_char(now() at time zone 'UTC', 'YYMMDD');
  n     int  := nextval('public.orders_daily_seq');
begin
  new.order_number := 'PEAK-' || stamp || '-' || lpad((n % 10000)::text, 4, '0');
  return new;
end
$$;

drop trigger if exists orders_set_number on public.orders;
create trigger orders_set_number
  before insert on public.orders
  for each row when (new.order_number is null)
  execute function public.gen_order_number();

create index if not exists orders_user_idx
  on public.orders (user_id, created_at desc);
create index if not exists orders_status_idx
  on public.orders (status) where status <> 'delivered';
create index if not exists orders_created_at_idx
  on public.orders (created_at desc);

-- ----------------------------------------------------------------------

create table if not exists public.order_items (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references public.orders(id) on delete cascade,
  product_id        uuid references public.products(id)         on delete set null,
  variant_id        uuid references public.product_variants(id) on delete set null,
  product_name      text not null,
  size              text,
  color_name        text,
  color_hex         text,
  unit_price_cents  integer not null check (unit_price_cents > 0),
  quantity          integer not null check (quantity > 0),
  created_at        timestamptz not null default now()
);

create index if not exists order_items_order_idx on public.order_items (order_id);

-- Keep orders.subtotal_cents in sync with the sum of its items. Fires on
-- any change to order_items.
create or replace function public.compute_order_subtotal()
returns trigger
language plpgsql
as $$
declare
  target uuid;
begin
  if tg_op = 'DELETE' then
    target := old.order_id;
  else
    target := new.order_id;
  end if;

  update public.orders
     set subtotal_cents = coalesce((
       select sum(unit_price_cents * quantity)
         from public.order_items
        where order_id = target
     ), 0)
   where id = target;

  return null;
end
$$;

drop trigger if exists order_items_recompute_subtotal on public.order_items;
create trigger order_items_recompute_subtotal
  after insert or update or delete on public.order_items
  for each row execute function public.compute_order_subtotal();

-- Stock decrement on pending → confirmed. Two layers of safety:
--   1. Pre-check: scan for any line that doesn't have enough stock. Gives
--      a clear "out_of_stock" error before any write.
--   2. The check (stock >= 0) constraint on product_variants. Catches
--      concurrent confirms that both pass the pre-check.
create or replace function public.decrement_stock_on_confirm()
returns trigger
language plpgsql
as $$
declare
  short_item record;
begin
  if old.status = 'pending' and new.status = 'confirmed' then
    select oi.variant_id, oi.quantity, pv.stock, oi.product_name
      into short_item
      from public.order_items oi
      join public.product_variants pv on pv.id = oi.variant_id
     where oi.order_id = new.id
       and pv.stock < oi.quantity
     limit 1;

    if found then
      raise exception 'out_of_stock for variant %, requested %, available %',
        short_item.variant_id, short_item.quantity, short_item.stock;
    end if;

    update public.product_variants pv
       set stock = pv.stock - oi.quantity
      from public.order_items oi
     where oi.order_id  = new.id
       and oi.variant_id = pv.id;
  end if;

  return new;
end
$$;

-- Restore stock if a confirmed order is later cancelled.
create or replace function public.restore_stock_on_cancel()
returns trigger
language plpgsql
as $$
begin
  if old.status = 'confirmed' and new.status = 'cancelled' then
    update public.product_variants pv
       set stock = pv.stock + oi.quantity
      from public.order_items oi
     where oi.order_id  = new.id
       and oi.variant_id = pv.id;
  end if;
  return new;
end
$$;

drop trigger if exists orders_decrement_stock on public.orders;
create trigger orders_decrement_stock
  before update on public.orders
  for each row execute function public.decrement_stock_on_confirm();

drop trigger if exists orders_restore_stock on public.orders;
create trigger orders_restore_stock
  before update on public.orders
  for each row execute function public.restore_stock_on_cancel();

-- ----------------------------------------------------------------------

alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

-- Customers read their own orders; admins read all.
drop policy if exists orders_select_own on public.orders;
create policy orders_select_own on public.orders
  for select using (auth.uid() is not null and user_id = auth.uid());

drop policy if exists orders_select_admin on public.orders;
create policy orders_select_admin on public.orders
  for select using (public.is_admin());

-- Customers (and anonymous guests, for COD) can insert orders. The check
-- pins user_id either to null (guest) or to the caller — you can't insert
-- an order on behalf of someone else.
drop policy if exists orders_insert_self_or_guest on public.orders;
create policy orders_insert_self_or_guest on public.orders
  for insert with check (user_id is null or user_id = auth.uid());

-- Only admins change status, shipping, or anything else after creation.
drop policy if exists orders_update_admin on public.orders;
create policy orders_update_admin on public.orders
  for update using (public.is_admin()) with check (public.is_admin());

-- order_items inherit visibility from the parent order.
drop policy if exists order_items_select on public.order_items;
create policy order_items_select on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
       where o.id = order_id
         and (o.user_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists order_items_insert on public.order_items;
create policy order_items_insert on public.order_items
  for insert with check (
    exists (
      select 1 from public.orders o
       where o.id = order_id
         and (o.user_id is null or o.user_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists order_items_update_admin on public.order_items;
create policy order_items_update_admin on public.order_items
  for update using (public.is_admin()) with check (public.is_admin());
