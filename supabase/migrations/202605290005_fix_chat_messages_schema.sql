-- Convert chat_messages from demo state shape to real message shape.

drop table if exists public.chat_messages;

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id text not null,
  sender_key text not null,
  sender_name text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_thread_created_idx
on public.chat_messages(thread_id, created_at);

alter table public.chat_messages enable row level security;

drop policy if exists "demo chat messages can read" on public.chat_messages;
drop policy if exists "demo chat messages can insert" on public.chat_messages;

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
