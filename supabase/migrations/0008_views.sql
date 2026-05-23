-- 0008_views.sql
-- customer_summary view. Replaces the old "customers" table from mock
-- data. Computed at query time so it can never drift from orders.
--
-- This view runs with its owner's privileges so it can read auth.users.
-- A WHERE clause inside the view enforces the same access rule RLS would:
--   * a customer sees only their own row
--   * an admin sees everyone
--
-- Safe to re-run.

create or replace view public.customer_summary as
select
  p.id,
  p.full_name,
  u.email,
  p.phone,
  p.avatar_color,
  p.created_at as joined_at,
  coalesce(count(o.id)           filter (where o.status <> 'cancelled'), 0)::int as orders_count,
  coalesce(sum(o.subtotal_cents) filter (where o.status <> 'cancelled'), 0)::int as total_spent_cents,
  mode() within group (order by o.ship_wilaya)                                   as preferred_wilaya
from public.profiles p
join auth.users u on u.id = p.id
left join public.orders o on o.user_id = p.id
where p.id = auth.uid() or public.is_admin()
group by p.id, u.email;
