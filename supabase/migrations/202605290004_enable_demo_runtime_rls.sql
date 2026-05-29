-- Re-enable RLS after demo seed.
-- Demo catalog tables are public-read only.
-- Demo state and points stay anon-writable for MVP test accounts.

alter table public.demo_users enable row level security;
alter table public.broker_offices enable row level security;
alter table public.broker_proposals enable row level security;
alter table public.direct_buyer_proposals enable row level security;

drop policy if exists "public can read demo users" on public.demo_users;
drop policy if exists "public can read broker offices" on public.broker_offices;
drop policy if exists "public can read broker proposals" on public.broker_proposals;
drop policy if exists "public can read direct buyer proposals" on public.direct_buyer_proposals;

create policy "public can read demo users"
on public.demo_users
for select
to anon, authenticated
using (true);

create policy "public can read broker offices"
on public.broker_offices
for select
to anon, authenticated
using (true);

create policy "public can read broker proposals"
on public.broker_proposals
for select
to anon, authenticated
using (true);

create policy "public can read direct buyer proposals"
on public.direct_buyer_proposals
for select
to anon, authenticated
using (true);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'demo_app_state',
    'contact_unlocks',
    'property_views',
    'broker_applications',
    'contact_requests',
    'chats',
    'chat_participants',
    'chat_messages',
    'profiles',
    'support_tickets',
    'reports'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists "demo state can read" on public.%I', table_name);
    execute format('drop policy if exists "demo state can insert" on public.%I', table_name);
    execute format('drop policy if exists "demo state can update" on public.%I', table_name);
    execute format('drop policy if exists "demo state can delete" on public.%I', table_name);
    execute format('create policy "demo state can read" on public.%I for select to anon, authenticated using (true)', table_name);
    execute format('create policy "demo state can insert" on public.%I for insert to anon, authenticated with check (true)', table_name);
    execute format('create policy "demo state can update" on public.%I for update to anon, authenticated using (true) with check (true)', table_name);
    execute format('create policy "demo state can delete" on public.%I for delete to anon, authenticated using (true)', table_name);
  end loop;
end $$;

alter table public.user_points enable row level security;
alter table public.point_ledger enable row level security;

drop policy if exists "demo points can read" on public.user_points;
drop policy if exists "demo points can insert" on public.user_points;
drop policy if exists "demo points can update" on public.user_points;
drop policy if exists "demo point ledger can read" on public.point_ledger;
drop policy if exists "demo point ledger can insert" on public.point_ledger;

create policy "demo points can read"
on public.user_points
for select
to anon, authenticated
using (true);

create policy "demo points can insert"
on public.user_points
for insert
to anon, authenticated
with check (true);

create policy "demo points can update"
on public.user_points
for update
to anon, authenticated
using (true)
with check (true);

create policy "demo point ledger can read"
on public.point_ledger
for select
to anon, authenticated
using (true);

create policy "demo point ledger can insert"
on public.point_ledger
for insert
to anon, authenticated
with check (true);
