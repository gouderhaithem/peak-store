-- 0013_total_stock_trigger.sql
-- Keep `products.total_stock` synced with the sum of variant stock.
--
-- Migration 0012 added `total_stock` as a temporary scalar written by the
-- product form. Now that the admin stock editor writes per-size variants,
-- the headline figure must follow whatever the variants say. This trigger
-- recomputes the sum on every insert/update/delete of product_variants.
--
-- Products that don't (yet) have any variants are left alone — the
-- product form is still the source of truth for those.
--
-- Safe to re-run.

create or replace function public.recompute_product_total_stock(p_product_id uuid)
returns void language plpgsql as $$
declare
  v_sum integer;
  v_has_variants boolean;
begin
  select coalesce(sum(stock), 0),
         count(*) > 0
    into v_sum, v_has_variants
    from public.product_variants
   where product_id = p_product_id;

  if v_has_variants then
    update public.products
       set total_stock = v_sum
     where id = p_product_id;
  end if;
end;
$$;

create or replace function public.product_variants_sync_total_stock()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'DELETE') then
    perform public.recompute_product_total_stock(old.product_id);
    return old;
  end if;

  perform public.recompute_product_total_stock(new.product_id);
  if (tg_op = 'UPDATE' and new.product_id <> old.product_id) then
    perform public.recompute_product_total_stock(old.product_id);
  end if;
  return new;
end;
$$;

drop trigger if exists product_variants_total_stock on public.product_variants;
create trigger product_variants_total_stock
  after insert or update or delete on public.product_variants
  for each row execute function public.product_variants_sync_total_stock();

comment on function public.recompute_product_total_stock(uuid) is
  'Recomputes products.total_stock as the sum of its variants. No-op for products with zero variants (legacy single-stock products).';
