-- Run this in Supabase SQL Editor and paste the result back to Codex.

create or replace function pg_temp.toad_count(required_table text, sql_text text)
returns bigint
language plpgsql
as $$
declare
  value bigint;
begin
  if to_regclass(required_table) is null then
    return 0;
  end if;

  execute sql_text into value;
  return coalesce(value, 0);
end;
$$;

create or replace function pg_temp.toad_json(required_table text, sql_text text, fallback jsonb)
returns jsonb
language plpgsql
as $$
declare
  value jsonb;
begin
  if to_regclass(required_table) is null then
    return fallback;
  end if;

  execute sql_text into value;
  return coalesce(value, fallback);
end;
$$;

select 'table_counts' as section, jsonb_build_object(
  'demo_users', (select count(*) from public.demo_users),
  'broker_offices', (select count(*) from public.broker_offices),
  'listings', (select count(*) from public.listings),
  'owner_seed_listings', (select count(*) from public.listings where owner_key like 'owner-%'),
  'broker_proposals', (select count(*) from public.broker_proposals),
  'direct_buyer_proposals', (select count(*) from public.direct_buyer_proposals),
  'demo_app_state', (select count(*) from public.demo_app_state),
  'contact_unlocks', (select count(*) from public.contact_unlocks),
  'property_views', (select count(*) from public.property_views),
  'broker_applications', (select count(*) from public.broker_applications),
  'contact_requests', (select count(*) from public.contact_requests),
  'chats', (select count(*) from public.chats),
  'chat_messages', (select count(*) from public.chat_messages),
  'listing_contracts', pg_temp.toad_count('public.listing_contracts', 'select count(*) from public.listing_contracts'),
  'profiles', (select count(*) from public.profiles),
  'support_tickets', (select count(*) from public.support_tickets),
  'reports', (select count(*) from public.reports),
  'user_points', (select count(*) from public.user_points),
  'point_ledger', (select count(*) from public.point_ledger)
) as result

union all

select 'demo_users_by_role', jsonb_object_agg(role, cnt order by role)
from (
  select role, count(*) as cnt
  from public.demo_users
  group by role
) s

union all

select 'owner_listing_distribution', jsonb_object_agg(owner_key, cnt order by owner_key)
from (
  select owner_key, count(*) as cnt
  from public.listings
  where owner_key like 'owner-%'
  group by owner_key
) s

union all

select 'listing_status_by_owner_seed', jsonb_object_agg(status, cnt order by status)
from (
  select coalesce(status, 'null') as status, count(*) as cnt
  from public.listings
  where owner_key like 'owner-%'
  group by coalesce(status, 'null')
) s

union all

select 'listing_fast_split', jsonb_object_agg(fast::text, cnt order by fast::text)
from (
  select coalesce(fast, false) as fast, count(*) as cnt
  from public.listings
  where owner_key like 'owner-%'
  group by coalesce(fast, false)
) s

union all

select 'listing_prop_type_distribution', jsonb_object_agg(prop_type, cnt order by prop_type)
from (
  select coalesce(prop_type, 'null') as prop_type, count(*) as cnt
  from public.listings
  where owner_key like 'owner-%'
  group by coalesce(prop_type, 'null')
) s

union all

select 'listing_address_quality', jsonb_build_object(
  'english_listing_addresses', (
    select count(*)
    from public.listings
    where owner_key like 'owner-%'
      and (
        coalesce(address, '') ~ '[A-Za-z]'
        or coalesce(region, '') ~ '[A-Za-z]'
        or coalesce(dong, '') ~ '[A-Za-z]'
        or coalesce(complex, '') ~ '[A-Za-z]'
      )
  ),
  'short_seoul_listing_addresses', (
    select count(*)
    from public.listings
    where owner_key like 'owner-%'
      and address like '서울 %'
  ),
  'english_broker_addresses', (
    select count(*)
    from public.broker_offices
    where coalesce(address, '') ~ '[A-Za-z]'
      or coalesce(region, '') ~ '[A-Za-z]'
      or coalesce(office_name, '') ~ '[A-Za-z]'
  ),
  'short_seoul_broker_addresses', (
    select count(*)
    from public.broker_offices
    where address like '서울 %'
  ),
  'listings_missing_address_parts', (
    select count(*)
    from public.listings
    where owner_key like 'owner-%'
      and (
        coalesce(address, '') = ''
        or coalesce(region, '') = ''
        or coalesce(dong, '') = ''
        or coalesce(complex, '') = ''
      )
  )
) as result

union all

select 'broker_proposal_activity', jsonb_object_agg(activity_type, cnt order by activity_type)
from (
  select activity_type, count(*) as cnt
  from public.broker_proposals
  group by activity_type
) s

union all

select 'direct_proposal_activity', jsonb_object_agg(activity_type, cnt order by activity_type)
from (
  select activity_type, count(*) as cnt
  from public.direct_buyer_proposals
  group by activity_type
) s

union all

select 'orphan_checks', jsonb_build_object(
  'listings_without_demo_owner', (
    select count(*)
    from public.listings l
    left join public.demo_users u on u.id = l.owner_key and u.role = 'owner'
    where l.owner_key like 'owner-%' and u.id is null
  ),
  'broker_proposals_without_listing', (
    select count(*)
    from public.broker_proposals p
    left join public.listings l on l.demo_listing_id = p.listing_id
    where l.demo_listing_id is null
  ),
  'broker_proposals_without_office', (
    select count(*)
    from public.broker_proposals p
    left join public.broker_offices o on o.id = p.broker_office_id
    where o.id is null
  ),
  'broker_offices_without_user', (
    select count(*)
    from public.broker_offices o
    left join public.demo_users u on u.id = o.broker_user_id and u.role = 'broker'
    where u.id is null
  ),
  'direct_proposals_without_listing', (
    select count(*)
    from public.direct_buyer_proposals p
    left join public.listings l on l.demo_listing_id = p.listing_id
    where l.demo_listing_id is null
  ),
  'listing_contracts_without_listing', (
    select pg_temp.toad_count(
      'public.listing_contracts',
      'select count(*) from public.listing_contracts c left join public.listings l on l.id::text = c.listing_id or l.demo_listing_id = c.listing_id where l.id is null'
    )
  ),
  'direct_proposals_without_buyer', (
    select count(*)
    from public.direct_buyer_proposals p
    left join public.demo_users u on u.id = p.buyer_user_id and u.role = 'buyer'
    where u.id is null
  )
)

union all

select 'null_required_checks', jsonb_build_object(
  'demo_users_missing_label', (select count(*) from public.demo_users where coalesce(label, '') = ''),
  'broker_offices_missing_name', (select count(*) from public.broker_offices where coalesce(office_name, '') = '' or coalesce(agent_name, '') = ''),
  'listings_missing_owner_key', (select count(*) from public.listings where owner_key is null),
  'listings_missing_demo_listing_id', (select count(*) from public.listings where owner_key like 'owner-%' and demo_listing_id is null),
  'listings_missing_owner_phone', (select count(*) from public.listings where owner_key like 'owner-%' and coalesce(owner_phone, '') = ''),
  'listings_missing_title', (select count(*) from public.listings where owner_key like 'owner-%' and coalesce(title, complex, '') = ''),
  'listing_contracts_missing_chat_id', pg_temp.toad_count(
    'public.listing_contracts',
    $audit$select count(*) from public.listing_contracts where coalesce(chat_id, '') = ''$audit$
  ),
  'chat_messages_missing_body', (select count(*) from public.chat_messages where coalesce(body, '') = '')
)

union all

select 'rls_enabled', jsonb_object_agg(tablename, rowsecurity order by tablename)
from pg_tables
where schemaname = 'public'
and tablename in (
  'listings',
  'demo_users',
  'broker_offices',
  'broker_proposals',
  'direct_buyer_proposals',
  'demo_app_state',
  'contact_unlocks',
  'property_views',
  'broker_applications',
  'contact_requests',
  'chats',
  'chat_messages',
  'listing_contracts',
  'profiles',
  'support_tickets',
  'reports',
  'user_points',
  'point_ledger'
)

union all

select 'policy_counts', jsonb_object_agg(tablename, cnt order by tablename)
from (
  select tablename, count(*) as cnt
  from pg_policies
  where schemaname = 'public'
  group by tablename
) s

union all

select 'chat_messages_columns', jsonb_object_agg(column_name, data_type order by ordinal_position)
from information_schema.columns
where table_schema = 'public'
and table_name = 'chat_messages'

union all

select 'legacy_chat_messages', jsonb_build_object(
  'invalid_thread_count', (
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
    select count(*)
    from public.chat_messages
    where not exists (
      select 1
      from valid_threads
      where valid_threads.thread_id = chat_messages.thread_id
    )
  ),
  'invalid_thread_ids', (
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
    select coalesce(jsonb_agg(thread_id order by thread_id), '[]'::jsonb)
    from (
      select distinct chat_messages.thread_id
      from public.chat_messages
      where not exists (
        select 1
        from valid_threads
        where valid_threads.thread_id = chat_messages.thread_id
      )
      order by chat_messages.thread_id
      limit 20
    ) invalid_threads
  )
)

union all

select 'sample_owner_001_listings', coalesce(jsonb_agg(jsonb_build_object(
  'demo_listing_id', demo_listing_id,
  'owner_key', owner_key,
  'owner_phone', owner_phone,
  'title', title,
  'status', status,
  'fast', fast
) order by demo_listing_id), '[]'::jsonb)
from public.listings
where owner_key = 'owner-001'

union all

select 'sample_listing_contracts', pg_temp.toad_json(
  'public.listing_contracts',
  $audit$
    select coalesce(jsonb_agg(jsonb_build_object(
      'listing_id', listing_id,
      'chat_id', chat_id,
      'partner_name', partner_name,
      'property', property,
      'contracted_at', contracted_at
    ) order by contracted_at desc), '[]'::jsonb)
    from (
      select *
      from public.listing_contracts
      order by contracted_at desc
      limit 10
    ) s
  $audit$,
  '[]'::jsonb
)

union all

select 'sample_chat_messages', coalesce(jsonb_agg(jsonb_build_object(
  'id', id,
  'thread_id', thread_id,
  'sender_key', sender_key,
  'sender_name', sender_name,
  'body', left(body, 80),
  'created_at', created_at
) order by created_at desc), '[]'::jsonb)
from (
  select *
  from public.chat_messages
  order by created_at desc
  limit 10
) s;
