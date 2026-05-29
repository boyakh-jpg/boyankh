-- 예전 더미 채팅 메시지와 삭제된 매물에 연결된 채팅 컨텍스트를 정리한다.

with valid_threads as (
  select 'listing-' || listings.id::text || '-' || demo_users.id as thread_id
  from public.listings
  cross join public.demo_users
  where demo_users.role = 'broker'
  union
  select 'direct-' || listings.id::text || '-' || demo_users.id as thread_id
  from public.listings
  cross join public.demo_users
  where demo_users.role = 'buyer'
)
delete from public.chat_messages as chat_messages
where not exists (
  select 1
  from valid_threads
  where valid_threads.thread_id = chat_messages.thread_id
);

update public.chats
set
  payload = coalesce((
    select jsonb_agg(context)
    from jsonb_array_elements(payload) as context
    where exists (
      select 1
      from public.listings
      where listings.id::text = context->'listing'->>'id'
         or listings.demo_listing_id = context->'listing'->>'demoListingId'
         or listings.demo_listing_id = context->'listing'->>'demo_listing_id'
    )
  ), '[]'::jsonb),
  updated_at = now()
where state_key = 'toad.chatContexts'
  and jsonb_typeof(payload) = 'array';

update public.demo_app_state
set
  payload = coalesce((
    select jsonb_agg(context)
    from jsonb_array_elements(payload) as context
    where exists (
      select 1
      from public.listings
      where listings.id::text = context->'listing'->>'id'
         or listings.demo_listing_id = context->'listing'->>'demoListingId'
         or listings.demo_listing_id = context->'listing'->>'demo_listing_id'
    )
  ), '[]'::jsonb),
  updated_at = now()
where state_key = 'toad.chatContexts'
  and jsonb_typeof(payload) = 'array';
