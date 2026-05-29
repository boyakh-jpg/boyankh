-- Repair RLS if older setup SQL left runtime tables with RLS disabled.

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
    'profiles',
    'support_tickets',
    'reports'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists "demo state can read" on public.%I', table_name);
    execute format('drop policy if exists "demo state can insert" on public.%I', table_name);
    execute format('drop policy if exists "demo state can update" on public.%I', table_name);
    execute format('drop policy if exists "demo state can delete" on public.%I', table_name);
    execute format('drop policy if exists "anon can read state" on public.%I', table_name);
    execute format('drop policy if exists "anon can insert state" on public.%I', table_name);
    execute format('drop policy if exists "anon can update state" on public.%I', table_name);
    execute format('create policy "demo state can read" on public.%I for select to anon, authenticated using (true)', table_name);
    execute format('create policy "demo state can insert" on public.%I for insert to anon, authenticated with check (true)', table_name);
    execute format('create policy "demo state can update" on public.%I for update to anon, authenticated using (true) with check (true)', table_name);
    execute format('create policy "demo state can delete" on public.%I for delete to anon, authenticated using (true)', table_name);
    execute format('grant select, insert, update, delete on table public.%I to anon, authenticated', table_name);
  end loop;
end $$;

alter table public.chat_messages enable row level security;

drop policy if exists "demo chat messages can read" on public.chat_messages;
drop policy if exists "demo chat messages can insert" on public.chat_messages;
drop policy if exists "public can read chat_messages" on public.chat_messages;
drop policy if exists "public can insert chat_messages" on public.chat_messages;

create policy "demo chat messages can read"
on public.chat_messages
for select
to anon, authenticated
using (true);

create policy "demo chat messages can insert"
on public.chat_messages
for insert
to anon, authenticated
with check (true);

grant select, insert on table public.chat_messages to anon, authenticated;
