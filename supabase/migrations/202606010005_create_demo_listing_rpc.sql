-- Allow demo owner accounts to create listings without exposing direct anon table insert.

create or replace function public.create_demo_listing(owner_key_arg text, listing_arg jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  created public.listings%rowtype;
begin
  if not exists (
    select 1
    from public.demo_users
    where id = owner_key_arg
      and role = 'owner'
  ) then
    raise exception 'invalid demo owner';
  end if;

  insert into public.listings (
    demo_listing_id,
    title,
    owner_key,
    price,
    address,
    region,
    dong,
    complex,
    prop_type,
    deal_type,
    price_label,
    price_num,
    premium,
    area,
    floor,
    fee,
    fast,
    views,
    status,
    done_label,
    completed_days_ago,
    expires_in_days,
    created_days_ago,
    price_history,
    supply_area,
    exclusive_area,
    total_floor,
    room_count,
    bath_count,
    move_in_date,
    loan,
    description,
    maintenance,
    parking,
    direction,
    special,
    tenant,
    tenant_end,
    tenant_deposit,
    tenant_monthly,
    tenant_memo,
    owner_phone
  )
  values (
    coalesce(nullif(listing_arg->>'demo_listing_id', ''), 'user-' || floor(extract(epoch from clock_timestamp()) * 1000)::bigint::text),
    coalesce(nullif(listing_arg->>'title', ''), nullif(listing_arg->>'complex', ''), '새 매물'),
    owner_key_arg,
    coalesce(nullif(listing_arg->>'price', '')::numeric, 0),
    nullif(listing_arg->>'address', ''),
    nullif(listing_arg->>'region', ''),
    nullif(listing_arg->>'dong', ''),
    nullif(listing_arg->>'complex', ''),
    nullif(listing_arg->>'prop_type', ''),
    nullif(listing_arg->>'deal_type', ''),
    nullif(listing_arg->>'price_label', ''),
    nullif(listing_arg->>'price_num', '')::numeric,
    nullif(listing_arg->>'premium', '')::numeric,
    nullif(listing_arg->>'area', '')::numeric,
    nullif(listing_arg->>'floor', '')::integer,
    nullif(listing_arg->>'fee', ''),
    coalesce(nullif(listing_arg->>'fast', '')::boolean, false),
    coalesce(nullif(listing_arg->>'views', '')::integer, 0),
    coalesce(nullif(listing_arg->>'status', ''), 'active'),
    nullif(listing_arg->>'done_label', ''),
    nullif(listing_arg->>'completed_days_ago', '')::integer,
    coalesce(nullif(listing_arg->>'expires_in_days', '')::integer, 14),
    coalesce(nullif(listing_arg->>'created_days_ago', '')::integer, 0),
    coalesce(listing_arg->'price_history', '[]'::jsonb),
    nullif(listing_arg->>'supply_area', '')::numeric,
    nullif(listing_arg->>'exclusive_area', '')::numeric,
    nullif(listing_arg->>'total_floor', '')::integer,
    nullif(listing_arg->>'room_count', '')::integer,
    nullif(listing_arg->>'bath_count', '')::integer,
    nullif(listing_arg->>'move_in_date', ''),
    nullif(listing_arg->>'loan', ''),
    nullif(listing_arg->>'description', ''),
    nullif(listing_arg->>'maintenance', ''),
    nullif(listing_arg->>'parking', ''),
    nullif(listing_arg->>'direction', ''),
    nullif(listing_arg->>'special', ''),
    nullif(listing_arg->>'tenant', ''),
    nullif(listing_arg->>'tenant_end', ''),
    nullif(listing_arg->>'tenant_deposit', ''),
    nullif(listing_arg->>'tenant_monthly', ''),
    nullif(listing_arg->>'tenant_memo', ''),
    coalesce(nullif(listing_arg->>'owner_phone', ''), (
      select phone
      from public.demo_users
      where id = owner_key_arg
      limit 1
    ))
  )
  returning * into created;

  return to_jsonb(created);
end;
$$;

revoke all on function public.create_demo_listing(text, jsonb) from public;
grant execute on function public.create_demo_listing(text, jsonb) to anon, authenticated;
