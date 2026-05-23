-- 0014_stock_transitions.sql
-- Unified stock side-effect handling for order status transitions.
--
-- Replaces the two narrow triggers from migration 0007
-- (decrement_stock_on_confirm + restore_stock_on_cancel) which only
-- caught pending→confirmed and confirmed→cancelled. Those missed:
--   * confirmed → shipped → cancelled  (stock lost forever)
--   * confirmed → delivered → cancelled
--   * cancelled → confirmed             (stock not re-deducted)
--
-- New model: think of statuses as buckets.
--   "deducted"     = (confirmed, shipped, delivered)  — stock is held
--   "not deducted" = (pending, cancelled)             — stock is free
--
-- Transition rule:
--   not-deducted → deducted  →  DECREMENT  (with out-of-stock pre-check)
--   deducted     → not-deducted → RESTORE
--   anything else            →  NO-OP
--
-- Safe to re-run.
--
-- Note: the pre-check + the `check (stock >= 0)` constraint on
-- product_variants together guard against overselling under
-- concurrent confirms.

create or replace function public.apply_stock_transition()
returns trigger
language plpgsql
as $$
declare
  old_deducted boolean := old.status in ('confirmed', 'shipped', 'delivered');
  new_deducted boolean := new.status in ('confirmed', 'shipped', 'delivered');
  short_item   record;
begin
  -- Becoming deducted: subtract per-line quantities from variant stock.
  if (not old_deducted) and new_deducted then
    -- Pre-check so the admin gets a clean 'out_of_stock' error instead of
    -- a generic check-constraint violation.
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

  -- Leaving deducted: give the stock back.
  elsif old_deducted and (not new_deducted) then
    update public.product_variants pv
       set stock = pv.stock + oi.quantity
      from public.order_items oi
     where oi.order_id  = new.id
       and oi.variant_id = pv.id;
  end if;

  return new;
end
$$;

-- Drop the old narrow triggers and replace with one.
drop trigger if exists orders_decrement_stock on public.orders;
drop trigger if exists orders_restore_stock   on public.orders;

drop trigger if exists orders_apply_stock_transition on public.orders;
create trigger orders_apply_stock_transition
  before update on public.orders
  for each row execute function public.apply_stock_transition();

-- Old functions are no longer wired to any trigger. Drop them so they
-- don't get accidentally re-attached or referenced.
drop function if exists public.decrement_stock_on_confirm();
drop function if exists public.restore_stock_on_cancel();
