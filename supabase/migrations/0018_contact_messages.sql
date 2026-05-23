-- 0018_contact_messages.sql
-- Stores contact form submissions so the admin can review them.
-- RLS: anyone can insert (guest-friendly), only admins can read.

create table if not exists public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  subject     text not null default 'general',
  message     text not null,
  created_at  timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

-- Anyone (including guests) can submit a message.
create policy "contact_insert_anyone"
  on public.contact_messages
  for insert
  with check (true);

-- Only admins can read submissions.
create policy "contact_select_admin"
  on public.contact_messages
  for select
  using (public.is_admin());
