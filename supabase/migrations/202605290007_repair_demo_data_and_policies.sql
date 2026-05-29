-- Repair demo data and policies found by audit_demo_runtime.sql.
-- 1. Remove legacy listings without a demo owner.
-- 2. Recreate missing read/write policies for demo runtime tables.

delete from public.listings
where owner_key is null;

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

grant select on table public.demo_users to anon, authenticated;
grant select on table public.broker_offices to anon, authenticated;
grant select on table public.broker_proposals to anon, authenticated;
grant select on table public.direct_buyer_proposals to anon, authenticated;

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

grant select, insert, update on table public.user_points to anon, authenticated;
grant select, insert on table public.point_ledger to anon, authenticated;
