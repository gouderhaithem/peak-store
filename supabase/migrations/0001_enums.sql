-- 0001_enums.sql
-- Custom column types used across the schema (roles, product categories,
-- order statuses, etc.) plus the shared update_updated_at() trigger
-- function used by every mutable table to auto-bump updated_at.
--
-- Safe to re-run.

do $$ begin
  create type public.user_role as enum ('customer', 'admin');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.product_gender as enum ('men', 'women', 'kids', 'unisex');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.product_type as enum ('running', 'basketball', 'casual', 'training', 'apparel');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.product_category as enum ('shoes', 'clothing', 'accessories');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.order_status as enum ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.payment_method as enum ('cod');
exception when duplicate_object then null;
end $$;

create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end
$$;
