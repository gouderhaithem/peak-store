-- 0002_profiles.sql
-- The `profiles` table extends auth.users with app-level fields
-- (full_name, phone, role, avatar). A row is auto-created on every signup.
--
-- Only the "self access" RLS policies live here. The admin-side policies
-- need is_admin(), which is defined in 0003.
--
-- Safe to re-run.

create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text not null,
  role          public.user_role not null default 'customer',
  phone         text,
  avatar_color  text default '#0A0A0A',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();

-- Auto-create a profile row when a new auth user signs up.
-- SECURITY DEFINER lets the function insert into public.profiles from the
-- auth schema. The search_path lockdown prevents schema-spoofing.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      split_part(new.email, '@', 1)
    )
  );
  return new;
end
$$;

drop trigger if exists handle_new_auth_user on auth.users;
create trigger handle_new_auth_user
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

alter table public.profiles enable row level security;

-- Read your own row.
drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self on public.profiles
  for select using (auth.uid() = id);

-- Update your own row, but NOT your role. The subselect reads the existing
-- role (allowed by profiles_select_self) and rejects the update if it changed.
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select role from public.profiles where id = auth.uid())
  );

-- No insert / delete policies. Inserts come from the auth trigger above
-- (SECURITY DEFINER, bypasses RLS). Deletes cascade from auth.users.
