-- Secure listings writes.
-- Read stays public. Insert/update/delete require Supabase Auth ownership.

alter table public.listings
  add column if not exists user_id uuid references auth.users(id) on delete set null;

alter table public.listings
  alter column user_id set default auth.uid();

create index if not exists listings_user_id_idx on public.listings(user_id);

alter table public.listings enable row level security;

drop policy if exists "public can read listings" on public.listings;
drop policy if exists "public can insert listings" on public.listings;
drop policy if exists "authenticated can insert own`listings" on public.listings;
drop policy if exists "authenticated can update own listings" on public.listings;
drop policy if exists "authenticated can delete own listings" on public.listings;

create policy "public can read listings"
on public.listings
for select
to anon, authenticated
using (true);

create policy "authenticated can insert own listings"
on public.listings
for insert
to authenticated
with check (user_id = auth.uid());

create policy "authenticated can update own listings"
on public.listings
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "authenticated can delete own listings"
on public.listings
for delete
to authenticated
using (user_id = auth.uid());

grant select on table public.listings to anon, authenticated;
grant insert, update, delete on table public.listings to authenticated;
revoke insert, update, delete on table public.listings from anon;
