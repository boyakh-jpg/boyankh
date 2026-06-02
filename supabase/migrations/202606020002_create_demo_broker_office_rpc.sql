alter table public.broker_offices add column if not exists city text;
alter table public.broker_offices add column if not exists dong text;
alter table public.broker_offices add column if not exists lat double precision;
alter table public.broker_offices add column if not exists lng double precision;

create unique index if not exists broker_offices_broker_user_id_uidx
on public.broker_offices (broker_user_id);

create or replace function public.create_demo_broker_office(
  broker_user_id_arg text,
  office_arg jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  saved public.broker_offices%rowtype;
  next_city text;
  next_region text;
  next_dong text;
  next_specialty_regions text[] := array[]::text[];
  next_specialty_types text[] := array[]::text[];
begin
  if office_arg is null then
    raise exception 'office payload is required';
  end if;

  if not exists (
    select 1
    from public.demo_users
    where id = broker_user_id_arg
      and role = 'broker'
  ) then
    raise exception 'invalid broker user %', broker_user_id_arg;
  end if;

  next_city := coalesce(nullif(office_arg->>'city', ''), nullif(split_part(coalesce(office_arg->>'address', ''), ' ', 1), ''), '서울특별시');
  next_region := coalesce(nullif(office_arg->>'region', ''), nullif(split_part(coalesce(office_arg->>'address', ''), ' ', 2), ''), '전체');
  next_dong := coalesce(nullif(office_arg->>'dong', ''), nullif(split_part(coalesce(office_arg->>'address', ''), ' ', 3), ''));

  if jsonb_typeof(office_arg->'specialty_regions') = 'array' then
    select coalesce(array_agg(value), array[]::text[])
    into next_specialty_regions
    from jsonb_array_elements_text(office_arg->'specialty_regions') as value;
  end if;
  if cardinality(next_specialty_regions) = 0 then
    next_specialty_regions := array[next_region];
  end if;

  if jsonb_typeof(office_arg->'specialty_types') = 'array' then
    select coalesce(array_agg(value), array[]::text[])
    into next_specialty_types
    from jsonb_array_elements_text(office_arg->'specialty_types') as value;
  end if;
  if cardinality(next_specialty_types) = 0 then
    next_specialty_types := array['아파트'];
  end if;

  update public.broker_offices
  set
    office_name = coalesce(nullif(office_arg->>'office_name', ''), office_name),
    agent_name = coalesce(nullif(office_arg->>'agent_name', ''), agent_name),
    license_no = coalesce(nullif(office_arg->>'license_no', ''), license_no),
    address = coalesce(nullif(office_arg->>'address', ''), address),
    phone = coalesce(nullif(office_arg->>'phone', ''), phone),
    city = next_city,
    region = next_region,
    dong = next_dong,
    lat = coalesce(nullif(office_arg->>'lat', '')::double precision, lat),
    lng = coalesce(nullif(office_arg->>'lng', '')::double precision, lng),
    specialty_regions = next_specialty_regions,
    specialty_types = next_specialty_types,
    business_hours = coalesce(nullif(office_arg->>'business_hours', ''), business_hours),
    proposal_message = coalesce(nullif(office_arg->>'proposal_message', ''), proposal_message),
    response_mode = coalesce(nullif(office_arg->>'response_mode', ''), response_mode),
    last_active = '방금 등록'
  where broker_user_id = broker_user_id_arg
  returning * into saved;

  if found then
    return to_jsonb(saved);
  end if;

  insert into public.broker_offices (
    id,
    broker_user_id,
    office_name,
    agent_name,
    license_no,
    address,
    phone,
    city,
    region,
    dong,
    lat,
    lng,
    specialty_regions,
    specialty_types,
    verified_deals_12m,
    percentile_in_region,
    tier,
    review_count,
    response_mode,
    business_hours,
    last_active,
    proposal_message,
    reviews
  )
  values (
    coalesce(nullif(office_arg->>'id', ''), 'office-' || broker_user_id_arg),
    broker_user_id_arg,
    coalesce(nullif(office_arg->>'office_name', ''), '신규 부동산'),
    coalesce(nullif(office_arg->>'agent_name', ''), '중개사'),
    coalesce(nullif(office_arg->>'license_no', ''), '미입력'),
    coalesce(nullif(office_arg->>'address', ''), '주소 미입력'),
    coalesce(nullif(office_arg->>'phone', ''), '연락처 미입력'),
    next_city,
    next_region,
    next_dong,
    nullif(office_arg->>'lat', '')::double precision,
    nullif(office_arg->>'lng', '')::double precision,
    next_specialty_regions,
    next_specialty_types,
    0,
    99,
    '검증 부동산',
    0,
    coalesce(nullif(office_arg->>'response_mode', ''), 'chat'),
    coalesce(nullif(office_arg->>'business_hours', ''), '평일 09:00-18:00'),
    '방금 등록',
    coalesce(nullif(office_arg->>'proposal_message', ''), ''),
    '[]'::jsonb
  )
  returning * into saved;

  return to_jsonb(saved);
end;
$$;

grant execute on function public.create_demo_broker_office(text, jsonb) to anon, authenticated;
