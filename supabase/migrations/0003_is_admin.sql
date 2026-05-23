-- 0003_is_admin.sql
-- The is_admin() helper. Every "admin can do X" policy elsewhere calls
-- this single function so there is exactly one place to change if the
-- definition of admin ever evolves.
--
-- Reads public.profiles, so SECURITY DEFINER is required — otherwise the
-- policy that calls it would block its own read.
--
-- Also adds the admin-side RLS policies for the profiles table, which
-- couldn't be created in 0002 because this function did not exist yet.
--
-- Safe to re-run.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.profiles
     where id = auth.uid()
       and role = 'admin'
  );
$$;

drop policy if exists profiles_select_admin on public.profiles;
create policy profiles_select_admin on public.profiles
  for select using (public.is_admin());

drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin on public.profiles
  for update using (public.is_admin())
  with check (public.is_admin());
