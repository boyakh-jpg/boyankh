-- Apply this whole file once in Supabase SQL Editor.

-- ============================================================
-- supabase\migrations\202605290002_seed_demo_runtime.sql
-- ============================================================
-- Seed a usable demo runtime without admin secret keys.
-- Run in Supabase SQL Editor before 202605290001_secure_listings_rls.sql.

create extension if not exists pgcrypto;

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid()
);

alter table public.listings add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.listings add column if not exists demo_listing_id text;
alter table public.listings add column if not exists owner_key text;
alter table public.listings add column if not exists title text;
alter table public.listings add column if not exists price integer;
alter table public.listings add column if not exists address text;
alter table public.listings add column if not exists region text;
alter table public.listings add column if not exists dong text;
alter table public.listings add column if not exists complex text;
alter table public.listings add column if not exists prop_type text;
alter table public.listings add column if not exists deal_type text;
alter table public.listings add column if not exists price_label text;
alter table public.listings add column if not exists price_num integer;
alter table public.listings add column if not exists premium integer;
alter table public.listings add column if not exists area integer;
alter table public.listings add column if not exists floor integer;
alter table public.listings add column if not exists fee text;
alter table public.listings add column if not exists fast boolean default false;
alter table public.listings add column if not exists views integer default 0;
alter table public.listings add column if not exists status text default 'active';
alter table public.listings add column if not exists done_label text;
alter table public.listings add column if not exists completed_days_ago integer;
alter table public.listings add column if not exists expires_in_days integer;
alter table public.listings add column if not exists created_days_ago integer;
alter table public.listings add column if not exists price_history jsonb default '[]'::jsonb;
alter table public.listings add column if not exists supply_area integer;
alter table public.listings add column if not exists exclusive_area integer;
alter table public.listings add column if not exists total_floor integer;
alter table public.listings add column if not exists room_count integer;
alter table public.listings add column if not exists bath_count integer;
alter table public.listings add column if not exists move_in_date text;
alter table public.listings add column if not exists loan text;
alter table public.listings add column if not exists description text;
alter table public.listings add column if not exists maintenance text;
alter table public.listings add column if not exists parking text;
alter table public.listings add column if not exists direction text;
alter table public.listings add column if not exists special text;
alter table public.listings add column if not exists tenant text;
alter table public.listings add column if not exists tenant_end text;
alter table public.listings add column if not exists tenant_deposit text;
alter table public.listings add column if not exists tenant_monthly text;
alter table public.listings add column if not exists tenant_memo text;

create unique index if not exists listings_demo_listing_id_idx
on public.listings(demo_listing_id)
where demo_listing_id is not null;

create table if not exists public.demo_users (
  id text primary key,
  role text not null check (role in ('owner', 'broker', 'buyer')),
  name text not null,
  label text not null,
  description text not null,
  region text not null,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.broker_offices (
  id text primary key,
  broker_user_id text not null references public.demo_users(id) on delete cascade,
  office_name text not null,
  agent_name text not null,
  license_no text not null,
  address text not null,
  phone text not null,
  region text not null,
  specialty_regions text[] not null default '{}',
  specialty_types text[] not null default '{}',
  verified_deals_12m integer not null default 0,
  percentile_in_region integer not null default 99,
  tier text not null default 'verified',
  review_count integer not null default 0,
  response_mode text not null default 'chat',
  business_hours text not null default '09:00-18:00',
  last_active text not null default 'today',
  proposal_message text not null default '',
  reviews jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.broker_proposals (
  id text primary key,
  owner_key text not null references public.demo_users(id) on delete cascade,
  listing_id text not null,
  broker_office_id text not null references public.broker_offices(id) on delete cascade,
  activity_type text not null,
  proposal_new boolean not null default true,
  request_id text,
  chat_id text,
  listing_title text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.direct_buyer_proposals (
  id text primary key,
  owner_key text not null references public.demo_users(id) on delete cascade,
  buyer_user_id text not null references public.demo_users(id) on delete cascade,
  listing_id text not null,
  name text not null,
  note text not null,
  budget text not null,
  activity_type text not null,
  proposal_new boolean not null default true,
  request_id text,
  chat_id text,
  listing_title text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.user_points (
  user_key text primary key,
  balance integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.point_ledger (
  id uuid primary key default gen_random_uuid(),
  user_key text not null,
  delta integer not null,
  balance_after integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);

alter table public.demo_users add column if not exists role text;
alter table public.demo_users add column if not exists name text;
alter table public.demo_users add column if not exists label text;
alter table public.demo_users add column if not exists description text;
alter table public.demo_users add column if not exists region text;
alter table public.demo_users add column if not exists phone text;
alter table public.demo_users add column if not exists created_at timestamptz default now();

alter table public.broker_offices add column if not exists broker_user_id text;
alter table public.broker_offices add column if not exists office_name text;
alter table public.broker_offices add column if not exists agent_name text;
alter table public.broker_offices add column if not exists license_no text;
alter table public.broker_offices add column if not exists address text;
alter table public.broker_offices add column if not exists phone text;
alter table public.broker_offices add column if not exists region text;
alter table public.broker_offices add column if not exists specialty_regions text[] default '{}';
alter table public.broker_offices add column if not exists specialty_types text[] default '{}';
alter table public.broker_offices add column if not exists verified_deals_12m integer default 0;
alter table public.broker_offices add column if not exists percentile_in_region integer default 99;
alter table public.broker_offices add column if not exists tier text default 'verified';
alter table public.broker_offices add column if not exists review_count integer default 0;
alter table public.broker_offices add column if not exists response_mode text default 'chat';
alter table public.broker_offices add column if not exists business_hours text default '09:00-18:00';
alter table public.broker_offices add column if not exists last_active text default 'today';
alter table public.broker_offices add column if not exists proposal_message text default '';
alter table public.broker_offices add column if not exists reviews jsonb default '[]'::jsonb;
alter table public.broker_offices add column if not exists created_at timestamptz default now();

alter table public.broker_proposals add column if not exists owner_key text;
alter table public.broker_proposals add column if not exists listing_id text;
alter table public.broker_proposals add column if not exists broker_office_id text;
alter table public.broker_proposals add column if not exists activity_type text;
alter table public.broker_proposals add column if not exists proposal_new boolean default true;
alter table public.broker_proposals add column if not exists request_id text;
alter table public.broker_proposals add column if not exists chat_id text;
alter table public.broker_proposals add column if not exists listing_title text;
alter table public.broker_proposals add column if not exists created_at timestamptz default now();

alter table public.direct_buyer_proposals add column if not exists owner_key text;
alter table public.direct_buyer_proposals add column if not exists buyer_user_id text;
alter table public.direct_buyer_proposals add column if not exists listing_id text;
alter table public.direct_buyer_proposals add column if not exists name text;
alter table public.direct_buyer_proposals add column if not exists note text;
alter table public.direct_buyer_proposals add column if not exists budget text;
alter table public.direct_buyer_proposals add column if not exists activity_type text;
alter table public.direct_buyer_proposals add column if not exists proposal_new boolean default true;
alter table public.direct_buyer_proposals add column if not exists request_id text;
alter table public.direct_buyer_proposals add column if not exists chat_id text;
alter table public.direct_buyer_proposals add column if not exists listing_title text;
alter table public.direct_buyer_proposals add column if not exists created_at timestamptz default now();

alter table public.user_points add column if not exists balance integer default 0;
alter table public.user_points add column if not exists updated_at timestamptz default now();

alter table public.point_ledger add column if not exists user_key text;
alter table public.point_ledger add column if not exists delta integer;
alter table public.point_ledger add column if not exists balance_after integer;
alter table public.point_ledger add column if not exists reason text;
alter table public.point_ledger add column if not exists created_at timestamptz default now();

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
    execute format('create table if not exists public.%I (state_key text primary key, payload jsonb not null default ''{}''::jsonb, updated_at timestamptz not null default now())', table_name);
    execute format('alter table public.%I disable row level security', table_name);
    execute format('grant select, insert, update, delete on table public.%I to anon, authenticated', table_name);
  end loop;

  foreach table_name in array array[
    'demo_users',
    'broker_offices',
    'broker_proposals',
    'direct_buyer_proposals',
    'user_points',
    'point_ledger'
  ] loop
    execute format('alter table public.%I disable row level security', table_name);
    execute format('grant select, insert, update, delete on table public.%I to anon, authenticated', table_name);
  end loop;
end $$;

delete from public.broker_proposals;
delete from public.direct_buyer_proposals;
delete from public.broker_offices;
delete from public.demo_users;
delete from public.listings
where owner_key like 'owner-%'
   or demo_listing_id like 'listing-%'
   or owner_key in ('toad-demo-owner', 'toad-demo-owner-2');

insert into public.demo_users (id, role, name, label, description, region, phone)
select 'owner-' || lpad(g::text, 3, '0'), 'owner', '?뚯쑀二?' || lpad(g::text, 3, '0'), '?뚯쑀二?' || lpad(g::text, 3, '0'), '留ㅻЪ ?깅줉 ?뚯뒪???뚯쑀二?,
       (array['Gangnam','Seocho','Songpa','Mapo','Yongsan','Seongdong','Yeongdeungpo','Gwangjin'])[(g - 1) % 8 + 1],
       '010-' || lpad((3100 + g)::text, 4, '0') || '-' || lpad((7000 + g)::text, 4, '0')
from generate_series(1, 20) as g
union all
select 'broker-' || lpad(g::text, 3, '0'), 'broker', '以묎컻??' || lpad(g::text, 3, '0'), '以묎컻??' || lpad(g::text, 3, '0'), '遺?숈궛 ?곸꽭移대뱶 ?뚯뒪??以묎컻??,
       (array['Gangnam','Seocho','Songpa','Mapo','Yongsan','Seongdong','Yeongdeungpo','Gwangjin'])[(g - 1) % 8 + 1],
       '010-' || lpad((4100 + g)::text, 4, '0') || '-' || lpad((6000 + g)::text, 4, '0')
from generate_series(1, 30) as g
union all
select 'buyer-' || lpad(g::text, 3, '0'), 'buyer', '吏곴굅??留ㅼ닔??' || lpad(g::text, 3, '0'), '吏곴굅??留ㅼ닔??' || lpad(g::text, 3, '0'), '吏곴굅??留ㅼ닔 ?뚯뒪??怨꾩젙',
       (array['Gangnam','Seocho','Songpa','Mapo','Yongsan','Seongdong','Yeongdeungpo','Gwangjin'])[(g - 1) % 8 + 1],
       '010-' || lpad((5100 + g)::text, 4, '0') || '-' || lpad((5000 + g)::text, 4, '0')
from generate_series(1, 10) as g;

with offices as (
  select
    g,
    'office-' || lpad(g::text, 3, '0') as id,
    'broker-' || lpad(g::text, 3, '0') as broker_user_id,
    (array['Gangnam','Seocho','Songpa','Mapo','Yongsan','Seongdong','Yeongdeungpo','Gwangjin'])[(g - 1) % 8 + 1] as region,
    (array['Apt','Officetel','Villa','Shop'])[(g - 1) % 4 + 1] as main_type,
    (5 + ((g * 7) % 88)) as percentile
  from generate_series(1, 30) as g
)
insert into public.broker_offices (
  id, broker_user_id, office_name, agent_name, license_no, address, phone, region,
  specialty_regions, specialty_types, verified_deals_12m, percentile_in_region, tier,
  review_count, response_mode, business_hours, last_active, proposal_message, reviews
)
select
  id,
  broker_user_id,
  region || ' ?좊뱶怨듭씤以묎컻??' || lpad(g::text, 2, '0'),
  '怨듭씤以묎컻??' || lpad(g::text, 2, '0'),
  '11' || lpad(g::text, 3, '0') || '-2026-' || lpad((100 + g)::text, 5, '0'),
  'Seoul ' || region || ' office ' || (100 + g),
  '02-' || lpad((7000 + g)::text, 4, '0') || '-' || lpad((2000 + g)::text, 4, '0'),
  region,
  array[region],
  array[main_type, 'Apt'],
  12 + ((g * 3) % 60),
  percentile,
  case when percentile <= 10 then 'top local broker' when percentile <= 30 then 'local power broker' else 'verified broker' end,
  3 + ((g * 5) % 35),
  (array['chat','call','sms'])[(g - 1) % 3 + 1],
  '09:00-18:00',
  case when g % 3 = 0 then 'before close' when g % 3 = 1 then 'active today' else 'active yesterday' end,
  '吏???섏슂? 諛⑸Ц ?쇱젙???뺤씤?덉뒿?덈떎. ?ㅻ뒛 諛붾줈 ?쒖븞 媛?ν빐??',
  jsonb_build_array(jsonb_build_object('id', 'review-' || id, 'tags', array['鍮좊Ⅸ ?묐떟','?쒖꽭 ?ㅻ챸'], 'text', '吏꾪뻾 ?곹솴??援ъ껜?곸쑝濡?怨듭쑀?댁ㄼ?댁슂.', 'createdAt', '2026-05-29'))
from offices;

with owner_listing_counts as (
  select
    g as owner_no,
    'owner-' || lpad(g::text, 3, '0') as owner_key,
    case
      when g <= 5 then 1
      when g <= 10 then 2
      when g <= 15 then 3
      else 4
    end as listing_count
  from generate_series(1, 20) as g
),
owner_listing_slots as (
  select
    owner_no,
    owner_key,
    slot
  from owner_listing_counts
  join lateral generate_series(1, listing_count) as slots(slot) on true
),
seed_base as (
  select
    row_number() over (order by owner_no, slot) as g,
    owner_key
  from owner_listing_slots
),
seed as (
  select
    g,
    'listing-' || lpad(g::text, 3, '0') as demo_listing_id,
    owner_key,
    (array['Gangnam','Seocho','Songpa','Mapo','Yongsan','Seongdong','Yeongdeungpo','Gwangjin'])[(g - 1) % 8 + 1] as region,
    (array['Yeoksam','Banpo','Jamsil','Gongdeok','Ichon','Seongsu','Yeouido','Gwangjang'])[(g - 1) % 8 + 1] as dong,
    (array['Raemian','Xi','Hillstate','Prugio','Lotte Castle','The Sharp','I-Park','Leciel','Park Rio','Hangang View'])[(g - 1) % 10 + 1] || ' ' || (((g - 1) % 5) + 1) || 'cha' as complex,
    (array['Apt','Officetel','Villa','Shop','Land'])[(g - 1) % 5 + 1] as prop_type,
    (array['Sale','Jeonse','Monthly','Lease'])[(g - 1) % 4 + 1] as deal_type,
    45000 + (g * 2600) as price_num,
    33 + (((g - 1) % 6) * 13) as area,
    1 + ((g * 3) % 29) as floor,
    (g % 3 = 1) as fast,
    (g * 17) % 140 as views,
    g % 9 as created_days_ago,
    greatest(1, 14 - (g % 13)) as expires_in_days
  from seed_base
)
insert into public.listings (
  demo_listing_id, owner_key, title, price, address, region, dong, complex, prop_type, deal_type,
  price_label, price_num, premium, area, floor, fee, fast, views, status, done_label,
  completed_days_ago, expires_in_days, created_days_ago, price_history, supply_area,
  exclusive_area, total_floor, room_count, bath_count, move_in_date, loan, description,
  maintenance, parking, direction, special, tenant, tenant_end, tenant_deposit, tenant_monthly,
  tenant_memo
)
select
  demo_listing_id,
  owner_key,
  region || ' ' || dong || ' ' || complex,
  price_num,
  'Seoul ' || region || ' ' || dong,
  region,
  dong,
  complex,
  prop_type,
  deal_type,
  case
    when deal_type = 'Monthly' then '5,000/' || (80 + (g * 7) % 180) || 'm'
    when deal_type = 'Jeonse' then (price_num / 10000) || 'eok ' || lpad((price_num % 10000)::text, 4, '0') || 'm'
    when deal_type = 'Lease' then '1eok/' || (90 + (g * 5) % 160) || 'm'
    else (price_num / 10000) || 'eok ' || lpad((price_num % 10000)::text, 4, '0') || 'm'
  end,
  price_num,
  case when prop_type in ('Shop','Land') then 1000 + g * 15 else null end,
  area,
  floor,
  (array['0.3%','0.4%','0.5%','0.6%'])[(g - 1) % 4 + 1],
  fast,
  views,
  'active',
  case when deal_type = 'Jeonse' then 'Jeonse done' when deal_type in ('Monthly','Lease') then 'Lease done' else 'Sale done' end,
  null,
  expires_in_days,
  created_days_ago,
  jsonb_build_array(jsonb_build_object('date', '2026-05-01', 'priceNum', price_num - 1200), jsonb_build_object('date', '2026-05-29', 'priceNum', price_num)),
  area + 15,
  area,
  30,
  3,
  2,
  'negotiable',
  'none',
  '?뚯쑀二?怨꾩젙?쇰줈 ?깅줉???뚯뒪??留ㅻЪ?낅땲??',
  '200k monthly',
  'available',
  'south',
  'Actual owner account listing for MVP runtime.',
  case when g % 4 = 0 then 'occupied' else 'vacant' end,
  case when g % 4 = 0 then '2027-03' else null end,
  case when g % 4 = 0 then '50000' else null end,
  case when g % 4 = 0 then '120' else null end,
  case when g % 4 = 0 then 'tenant approval needed' else null end
from seed
on conflict (demo_listing_id) where demo_listing_id is not null do update set
  owner_key = excluded.owner_key,
  title = excluded.title,
  price = excluded.price,
  address = excluded.address,
  region = excluded.region,
  dong = excluded.dong,
  complex = excluded.complex,
  prop_type = excluded.prop_type,
  deal_type = excluded.deal_type,
  price_label = excluded.price_label,
  price_num = excluded.price_num,
  premium = excluded.premium,
  area = excluded.area,
  floor = excluded.floor,
  fee = excluded.fee,
  fast = excluded.fast,
  views = excluded.views,
  status = excluded.status,
  done_label = excluded.done_label,
  completed_days_ago = excluded.completed_days_ago,
  expires_in_days = excluded.expires_in_days,
  created_days_ago = excluded.created_days_ago,
  price_history = excluded.price_history,
  supply_area = excluded.supply_area,
  exclusive_area = excluded.exclusive_area,
  total_floor = excluded.total_floor,
  room_count = excluded.room_count,
  bath_count = excluded.bath_count,
  move_in_date = excluded.move_in_date,
  loan = excluded.loan,
  description = excluded.description,
  maintenance = excluded.maintenance,
  parking = excluded.parking,
  direction = excluded.direction,
  special = excluded.special,
  tenant = excluded.tenant,
  tenant_end = excluded.tenant_end,
  tenant_deposit = excluded.tenant_deposit,
  tenant_monthly = excluded.tenant_monthly,
  tenant_memo = excluded.tenant_memo;

insert into public.broker_proposals (
  id, owner_key, listing_id, broker_office_id, activity_type, proposal_new, request_id, chat_id, listing_title, created_at
)
select
  'broker-proposal-' || lpad(g::text, 3, '0'),
  l.owner_key,
  l.demo_listing_id,
  'office-' || lpad((((g * 3) % 30) + 1)::text, 3, '0'),
  case when l.fast then U&'\BE60\B978\C758\B8B0' else U&'\C548\C2EC\C758\B8B0' end,
  case when l.owner_key = 'owner-001' then g in (1, 21) else g % 4 in (1, 2) end,
  case when l.fast then null else 'broker-request-' || lpad(g::text, 3, '0') end,
  'broker-chat-' || lpad(g::text, 3, '0'),
  l.region || ' ' || l.dong || ' ' || l.complex || ' / ' || coalesce(l.exclusive_area, l.area)::text,
  now() - ((g % 8) || ' hours')::interval
from public.listings l
join generate_series(1, 50) as g on l.demo_listing_id = 'listing-' || lpad(g::text, 3, '0');

insert into public.direct_buyer_proposals (
  id, owner_key, buyer_user_id, listing_id, name, note, budget, activity_type, proposal_new, request_id, chat_id, listing_title, created_at
)
select
  'direct-proposal-' || lpad(g::text, 3, '0'),
  l.owner_key,
  'buyer-' || lpad((((g - 1) % 10) + 1)::text, 3, '0'),
  l.demo_listing_id,
  '吏곴굅??留ㅼ닔??' || lpad(((((g - 1) % 10) + 1)::text), 3, '0'),
  case when g % 2 = 0 then '?ㅺ굅二?紐⑹쟻, ?異??ъ쟾?ъ궗 ?꾨즺' else '?ъ옄 紐⑹쟻, 鍮좊Ⅸ ?붽툑 ?묒쓽 媛?? end,
  case when l.deal_type in ('Monthly','Lease') then '??' || (120 + g * 3) || '留?媛?? else ((l.price_num / 10000) + 1) || '?듬? 媛?? end,
  case when g % 3 = 0 then U&'\C5F4\B78C' else U&'\C548\C2EC\C758\B8B0' end,
  case when l.owner_key = 'owner-001' then g in (1, 41) else g % 5 = 0 end,
  case when g % 3 = 0 then null else 'direct-request-' || lpad(g::text, 3, '0') end,
  'direct-chat-' || lpad(g::text, 3, '0'),
  l.region || ' ' || l.dong || ' ' || l.complex || ' / ' || coalesce(l.exclusive_area, l.area)::text,
  now() - ((g % 12) || ' hours')::interval
from public.listings l
join generate_series(1, 50) as g on l.demo_listing_id = 'listing-' || lpad(g::text, 3, '0')
where g % 2 = 1;

insert into public.user_points (user_key, balance, updated_at)
select id, case role when 'broker' then 50000 when 'buyer' then 30000 else 12000 end, now()
from public.demo_users
on conflict (user_key) do update set balance = excluded.balance, updated_at = now();

-- ============================================================
-- supabase\migrations\202605290003_reseed_owner_listing_distribution.sql
-- ============================================================
-- Reassign seeded listings so each demo owner has 1 to 4 listings.
-- Run after 202605290002_seed_demo_runtime.sql if that seed was already applied.

with owner_listing_counts as (
  select
    g as owner_no,
    'owner-' || lpad(g::text, 3, '0') as owner_key,
    case
      when g <= 5 then 1
      when g <= 10 then 2
      when g <= 15 then 3
      else 4
    end as listing_count
  from generate_series(1, 20) as g
),
owner_listing_slots as (
  select
    owner_no,
    owner_key,
    slot
  from owner_listing_counts
  join lateral generate_series(1, listing_count) as slots(slot) on true
),
listing_owner_map as (
  select
    'listing-' || lpad((row_number() over (order by owner_no, slot))::text, 3, '0') as demo_listing_id,
    owner_key
  from owner_listing_slots
)
update public.listings as listings
set owner_key = listing_owner_map.owner_key
from listing_owner_map
where listings.demo_listing_id = listing_owner_map.demo_listing_id;

with owner_listing_counts as (
  select
    g as owner_no,
    'owner-' || lpad(g::text, 3, '0') as owner_key,
    case
      when g <= 5 then 1
      when g <= 10 then 2
      when g <= 15 then 3
      else 4
    end as listing_count
  from generate_series(1, 20) as g
),
owner_listing_slots as (
  select
    owner_no,
    owner_key,
    slot
  from owner_listing_counts
  join lateral generate_series(1, listing_count) as slots(slot) on true
),
listing_owner_map as (
  select
    'listing-' || lpad((row_number() over (order by owner_no, slot))::text, 3, '0') as demo_listing_id,
    owner_key
  from owner_listing_slots
)
update public.broker_proposals as broker_proposals
set owner_key = listing_owner_map.owner_key
from listing_owner_map
where broker_proposals.listing_id = listing_owner_map.demo_listing_id;

with owner_listing_counts as (
  select
    g as owner_no,
    'owner-' || lpad(g::text, 3, '0') as owner_key,
    case
      when g <= 5 then 1
      when g <= 10 then 2
      when g <= 15 then 3
      else 4
    end as listing_count
  from generate_series(1, 20) as g
),
owner_listing_slots as (
  select
    owner_no,
    owner_key,
    slot
  from owner_listing_counts
  join lateral generate_series(1, listing_count) as slots(slot) on true
),
listing_owner_map as (
  select
    'listing-' || lpad((row_number() over (order by owner_no, slot))::text, 3, '0') as demo_listing_id,
    owner_key
  from owner_listing_slots
)
update public.direct_buyer_proposals as direct_buyer_proposals
set owner_key = listing_owner_map.owner_key
from listing_owner_map
where direct_buyer_proposals.listing_id = listing_owner_map.demo_listing_id;

-- ============================================================
-- supabase\migrations\202605290001_secure_listings_rls.sql
-- ============================================================
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

-- ============================================================
-- supabase\migrations\202605290004_enable_demo_runtime_rls.sql
-- ============================================================
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

-- ============================================================
-- supabase\migrations\202605290005_fix_chat_messages_schema.sql
-- ============================================================
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

-- ============================================================
-- supabase\migrations\202605290006_reenable_runtime_rls.sql
-- ============================================================
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

-- ============================================================
-- supabase\migrations\202605290007_repair_demo_data_and_policies.sql
-- ============================================================
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

-- ============================================================
-- supabase\migrations\202605290008_koreanize_demo_listings.sql
-- ============================================================
-- seed 留ㅻЪ???쒓??뷀븯怨??뚯쑀二??녿뒗 ?덉쟾 ?뚯뒪??留ㅻЪ????젣?쒕떎.

delete from public.listings
where owner_key is null;

with seed as (
  select
    g,
    'listing-' || lpad(g::text, 3, '0') as demo_listing_id,
    (array['媛뺣궓援?,'?쒖큹援?,'?≫뙆援?,'留덊룷援?,'?⑹궛援?,'?깅룞援?,'?곷벑?ш뎄','愿묒쭊援?])[(g - 1) % 8 + 1] as region,
    (array['??궪??,'諛섑룷??,'?좎떎??,'怨듬뜒??,'?댁큿??,'?깆닔??,'?ъ쓽?꾨룞','愿묒옣??])[(g - 1) % 8 + 1] as dong,
    (array['?섎???,'?먯씠','?먯뒪?뚯씠??,'?몃Ⅴ吏??,'濡?뜲罹먯뒳','?붿꺏','?꾩씠?뚰겕','瑜댁떆??,'?뚰겕由ъ삤','?쒓컯酉?])[(g - 1) % 10 + 1] || ' ' || (((g - 1) % 5) + 1) || '李? as complex,
    (array['?꾪뙆??,'?ㅽ뵾?ㅽ뀛','鍮뚮씪','?곴?','?좎?'])[(g - 1) % 5 + 1] as prop_type,
    (array['留ㅻℓ','?꾩꽭','?붿꽭','?꾨?'])[(g - 1) % 4 + 1] as deal_type,
    45000 + (g * 2600) as price_num,
    33 + (((g - 1) % 6) * 13) as area,
    1 + ((g * 3) % 29) as floor
  from generate_series(1, 50) as g
),
korean_seed as (
  select
    *,
    region || ' ' || dong || ' ' || complex as title,
    '?쒖슱 ' || region || ' ' || dong as address,
    case
      when deal_type = '?붿꽭' then '5,000/' || (80 + (g * 7) % 180) || '留?
      when deal_type = '?꾨?' then '1??' || (90 + (g * 5) % 160) || '留?
      when price_num % 10000 = 0 then (price_num / 10000) || '??
      else (price_num / 10000) || '??' || to_char(price_num % 10000, 'FM9,999') || '留?
    end as price_label,
    case
      when deal_type = '?꾩꽭' then '?꾩꽭?꾨즺'
      when deal_type in ('?붿꽭','?꾨?') then '?꾨??꾨즺'
      else '留ㅻ룄?꾨즺'
    end as done_label
  from seed
)
update public.listings as listings
set
  title = korean_seed.title,
  address = korean_seed.address,
  region = korean_seed.region,
  dong = korean_seed.dong,
  complex = korean_seed.complex,
  prop_type = korean_seed.prop_type,
  deal_type = korean_seed.deal_type,
  price_label = korean_seed.price_label,
  price_num = korean_seed.price_num,
  price = korean_seed.price_num,
  area = korean_seed.area,
  floor = korean_seed.floor,
  done_label = korean_seed.done_label,
  move_in_date = case when korean_seed.g % 3 = 0 then '利됱떆?낆＜' else '?묒쓽 媛?? end,
  loan = case when korean_seed.g % 4 = 0 then '?異??묒쓽' else '?異?媛?? end,
  description = '?뚯쑀二?怨꾩젙?쇰줈 ?깅줉???ㅼ젣 援щ룞 ?뚯뒪??留ㅻЪ?낅땲??',
  maintenance = '20留뚯썝',
  parking = '1? 媛??,
  direction = case when korean_seed.g % 2 = 0 then '?⑦뼢' else '?숉뼢' end,
  special = '?ㅼ젣 ?뚯쑀二쇨? ?깅줉???쒓? ?뚯뒪??留ㅻЪ?낅땲??',
  tenant = case when korean_seed.g % 4 = 0 then '?꾩감???덉쓬' else '怨듭떎' end,
  tenant_end = case when korean_seed.g % 4 = 0 then '2027??3?? else null end,
  tenant_deposit = case when korean_seed.g % 4 = 0 then '50000' else null end,
  tenant_monthly = case when korean_seed.g % 4 = 0 then '120' else null end,
  tenant_memo = case when korean_seed.g % 4 = 0 then '?꾩감???뺤씤 ?꾩슂' else null end
from korean_seed
where listings.demo_listing_id = korean_seed.demo_listing_id;

update public.broker_proposals as broker_proposals
set listing_title = listings.region || ' ' || listings.dong || ' ' || listings.complex || ' / ' || coalesce(listings.exclusive_area, listings.area)::text || '??
from public.listings as listings
where broker_proposals.listing_id = listings.demo_listing_id
  and listings.demo_listing_id like 'listing-%';

update public.direct_buyer_proposals as direct_buyer_proposals
set listing_title = listings.region || ' ' || listings.dong || ' ' || listings.complex || ' / ' || coalesce(listings.exclusive_area, listings.area)::text || '??
from public.listings as listings
where direct_buyer_proposals.listing_id = listings.demo_listing_id
  and listings.demo_listing_id like 'listing-%';

-- ============================================================
-- supabase\migrations\202605290009_cleanup_legacy_chats.sql
-- ============================================================
-- ?덉쟾 ?붾? 梨꾪똿 硫붿떆吏? ??젣??留ㅻЪ???곌껐??梨꾪똿 而⑦뀓?ㅽ듃瑜??뺣━?쒕떎.

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

-- ============================================================
-- supabase\migrations\202605290010_remove_demo_test_chat.sql
-- ============================================================
-- 怨듭슜 ?뚯뒪??梨꾪똿諛??곗씠?곕? ?쒓굅?쒕떎.

delete from public.chat_messages
where thread_id = 'demo-test-chat';

update public.chats
set
  payload = coalesce((
    select jsonb_agg(context)
    from jsonb_array_elements(payload) as context
    where context->>'id' <> 'demo-test-chat'
  ), '[]'::jsonb),
  updated_at = now()
where state_key = 'toad.chatContexts'
  and jsonb_typeof(payload) = 'array';

update public.demo_app_state
set
  payload = coalesce((
    select jsonb_agg(context)
    from jsonb_array_elements(payload) as context
    where context->>'id' <> 'demo-test-chat'
  ), '[]'::jsonb),
  updated_at = now()
where state_key = 'toad.chatContexts'
  and jsonb_typeof(payload) = 'array';

-- ============================================================
-- supabase\migrations\202605290011_add_listing_owner_phone.sql
-- ============================================================
-- Store listing owner contact numbers in the database.

alter table public.listings
add column if not exists owner_phone text;

update public.listings as listings
set owner_phone = demo_users.phone
from public.demo_users as demo_users
where listings.owner_key = demo_users.id
  and demo_users.role = 'owner'
  and (listings.owner_phone is null or listings.owner_phone = '');

-- ============================================================
-- supabase\migrations\202606010001_create_listing_contracts.sql
-- ============================================================
-- Store completed listing contracts and expire the matched listing in the database.

create table if not exists public.listing_contracts (
  listing_id text primary key,
  chat_id text not null,
  partner_name text,
  property text,
  contracted_at timestamptz not null default now()
);

alter table public.listing_contracts enable row level security;

drop policy if exists "public can read listing contracts" on public.listing_contracts;
drop policy if exists "public can insert listing contracts" on public.listing_contracts;
drop policy if exists "public can update listing contracts" on public.listing_contracts;

create policy "public can read listing contracts"
on public.listing_contracts
for select
to anon, authenticated
using (true);

create policy "public can insert listing contracts"
on public.listing_contracts
for insert
to anon, authenticated
with check (true);

create policy "public can update listing contracts"
on public.listing_contracts
for update
to anon, authenticated
using (true)
with check (true);

grant select, insert, update on table public.listing_contracts to anon, authenticated;

insert into public.listing_contracts (listing_id, chat_id, partner_name, property, contracted_at)
select
  contract.key,
  contract.value->>'chatId',
  contract.value->>'partnerName',
  contract.value->>'property',
  coalesce(nullif(contract.value->>'contractedAt', '')::timestamptz, now())
from public.demo_app_state
cross join lateral jsonb_each(payload) as contract(key, value)
where state_key = 'toad.listingContracts'
  and jsonb_typeof(payload) = 'object'
  and coalesce(contract.value->>'chatId', '') <> ''
on conflict (listing_id) do update
set
  chat_id = excluded.chat_id,
  partner_name = excluded.partner_name,
  property = excluded.property,
  contracted_at = excluded.contracted_at;

create or replace function public.apply_listing_contract()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.listings
  set
    status = 'done',
    completed_days_ago = 0,
    expires_in_days = 0,
    done_label = case
      when deal_type in ('전세', 'Jeonse') then '전세완료'
      when deal_type in ('월세', '임대', 'Lease', 'Monthly') then '임대완료'
      when deal_type in ('전매') then '전매완료'
      when deal_type in ('권리양도') then '양도완료'
      else '매도완료'
    end
  where listings.id::text = new.listing_id
     or listings.demo_listing_id = new.listing_id;

  return new;
end;
$$;

drop trigger if exists apply_listing_contract_after_write on public.listing_contracts;

create trigger apply_listing_contract_after_write
after insert or update on public.listing_contracts
for each row
execute function public.apply_listing_contract();

update public.listings
set
  status = 'done',
  completed_days_ago = 0,
  expires_in_days = 0,
  done_label = case
    when deal_type in ('전세', 'Jeonse') then '전세완료'
    when deal_type in ('월세', '임대', 'Lease', 'Monthly') then '임대완료'
    when deal_type in ('전매') then '전매완료'
    when deal_type in ('권리양도') then '양도완료'
    else '매도완료'
  end
from public.listing_contracts
where listings.id::text = listing_contracts.listing_id
   or listings.demo_listing_id = listing_contracts.listing_id;

-- ============================================================
-- supabase\migrations\202606010002_group_property_types.sql
-- ============================================================
-- Normalize listing property types into the grouped MVP taxonomy.

with typed_listings as (
  select
    id,
    row_number() over (order by coalesce(demo_listing_id, id::text)) as rn
  from public.listings
  where owner_key like 'owner-%'
)
update public.listings as listings
set
  prop_type = grouped.prop_type,
  deal_type = grouped.deal_type,
  done_label = grouped.done_label
from typed_listings
cross join lateral (
  select (array[
    '아파트',
    '재건축',
    '오피스텔',
    '빌라',
    '아파트분양권',
    '오피스텔분양권',
    '원룸',
    '단독/다가구',
    '상가주택',
    '재개발',
    '상가',
    '토지',
    '사무실',
    '건물',
    '공장/창고',
    '지식산업센터'
  ])[(typed_listings.rn - 1) % 16 + 1] as prop_type
) as selected
cross join lateral (
  select
    selected.prop_type,
    case
      when selected.prop_type in ('재건축', '재개발') then '권리양도'
      when selected.prop_type in ('아파트분양권', '오피스텔분양권') then '전매'
      when selected.prop_type = '토지' then '매매'
      when selected.prop_type in ('상가', '상가주택', '사무실', '건물', '공장/창고', '지식산업센터') then
        case when typed_listings.rn % 2 = 0 then '임대' else '매매' end
      else (array['매매', '전세', '월세'])[(typed_listings.rn - 1) % 3 + 1]
    end as deal_type,
    case
      when selected.prop_type in ('재건축', '재개발') then '양도완료'
      when selected.prop_type in ('아파트분양권', '오피스텔분양권') then '전매완료'
      when selected.prop_type in ('상가', '상가주택', '사무실', '건물', '공장/창고', '지식산업센터') and typed_listings.rn % 2 = 0 then '임대완료'
      when selected.prop_type = '토지' then '매도완료'
      when (array['매매', '전세', '월세'])[(typed_listings.rn - 1) % 3 + 1] = '전세' then '전세완료'
      when (array['매매', '전세', '월세'])[(typed_listings.rn - 1) % 3 + 1] = '월세' then '임대완료'
      else '매도완료'
    end as done_label
) as grouped
where listings.id = typed_listings.id;

update public.listings
set prop_type = case
  when prop_type = 'Apt' then '아파트'
  when prop_type = 'Officetel' then '오피스텔'
  when prop_type in ('Villa', '빌라/다세대') then '빌라'
  when prop_type = 'Shop' then '상가'
  when prop_type = 'Land' then '토지'
  when prop_type = '분양권' then '아파트분양권'
  when prop_type = '입주권' then '재건축'
  when prop_type = '재개발·재건축' then '재건축'
  when prop_type = '단독주택' then '단독/다가구'
  when prop_type = '상기' then '상가'
  else prop_type
end;

update public.broker_offices
set specialty_types = case
  when specialty_types is null or cardinality(specialty_types) = 0 then specialty_types
  else (
    select array_agg(distinct case
      when value = 'Apt' then '아파트'
      when value = 'Officetel' then '오피스텔'
      when value in ('Villa', '빌라/다세대') then '빌라'
      when value = 'Shop' then '상가'
      when value = 'Land' then '토지'
      when value = '분양권' then '아파트분양권'
      when value = '입주권' then '재건축'
      when value = '재개발·재건축' then '재건축'
      when value = '단독주택' then '단독/다가구'
      when value = '상기' then '상가'
      else value
    end)
    from unnest(specialty_types) as value
  )
end;

-- supabase\migrations\202606010003_koreanize_addresses.sql
-- Convert remaining English demo listing and broker office addresses to Korean display addresses.

with listing_seed as (
  select
    g,
    'listing-' || lpad(g::text, 3, '0') as demo_listing_id,
    (array['강남구','서초구','송파구','마포구','용산구','성동구','영등포구','광진구'])[(g - 1) % 8 + 1] as region,
    (array['역삼동','반포동','잠실동','공덕동','이촌동','성수동','여의도동','광장동'])[(g - 1) % 8 + 1] as dong,
    (array['래미안','자이','힐스테이트','푸르지오','롯데캐슬','더샵','아이파크','르시엘','파크리오','한강뷰'])[(g - 1) % 10 + 1] || ' ' || (((g - 1) % 5) + 1) || '차' as complex
  from generate_series(1, 50) as g
)
update public.listings as listings
set
  title = listing_seed.region || ' ' || listing_seed.dong || ' ' || listing_seed.complex,
  address = '서울특별시 ' || listing_seed.region || ' ' || listing_seed.dong || ' ' || listing_seed.complex,
  region = listing_seed.region,
  dong = listing_seed.dong,
  complex = listing_seed.complex
from listing_seed
where listings.demo_listing_id = listing_seed.demo_listing_id
  and (
    coalesce(listings.address, '') ~ '[A-Za-z]'
    or coalesce(listings.region, '') ~ '[A-Za-z]'
    or coalesce(listings.dong, '') ~ '[A-Za-z]'
    or coalesce(listings.complex, '') ~ '[A-Za-z]'
  );

with office_seed as (
  select
    g,
    'office-' || lpad(g::text, 3, '0') as id,
    (array['강남구','서초구','송파구','마포구','용산구','성동구','영등포구','광진구'])[(g - 1) % 8 + 1] as region,
    (array['역삼동','반포동','잠실동','공덕동','이촌동','성수동','여의도동','광장동'])[(g - 1) % 8 + 1] as dong
  from generate_series(1, 30) as g
)
update public.broker_offices as offices
set
  office_name = office_seed.region || ' 토드공인중개사 ' || lpad(office_seed.g::text, 2, '0'),
  address = '서울특별시 ' || office_seed.region || ' ' || office_seed.dong || ' ' || (100 + office_seed.g),
  region = office_seed.region,
  specialty_regions = array[office_seed.region],
  tier = case
    when offices.percentile_in_region <= 10 then '지역 대표 부동산'
    when offices.percentile_in_region <= 30 then '지역 파워 부동산'
    else '검증 부동산'
  end,
  last_active = case
    when office_seed.g % 3 = 0 then '방금 전 제안'
    when office_seed.g % 3 = 1 then '오늘 활동'
    else '어제 활동'
  end
from office_seed
where offices.id = office_seed.id
  and (
    coalesce(offices.address, '') ~ '[A-Za-z]'
    or coalesce(offices.region, '') ~ '[A-Za-z]'
    or coalesce(offices.office_name, '') ~ '[A-Za-z]'
  );

update public.broker_proposals as proposals
set listing_title = listings.region || ' ' || listings.dong || ' ' || listings.complex || ' / ' || coalesce(listings.exclusive_area, listings.area)::text || '㎡'
from public.listings as listings
where proposals.listing_id = listings.demo_listing_id
  and listings.demo_listing_id like 'listing-%';

update public.direct_buyer_proposals as proposals
set listing_title = listings.region || ' ' || listings.dong || ' ' || listings.complex || ' / ' || coalesce(listings.exclusive_area, listings.area)::text || '㎡'
from public.listings as listings
where proposals.listing_id = listings.demo_listing_id
  and listings.demo_listing_id like 'listing-%';

-- supabase\migrations\202606010004_expand_seoul_addresses.sql
-- Expand Seoul demo display addresses while keeping region filters as district names.

update public.listings
set address = regexp_replace(address, '^서울 ', '서울특별시 ')
where owner_key like 'owner-%'
  and address like '서울 %';

update public.broker_offices
set address = regexp_replace(address, '^서울 ', '서울특별시 ')
where address like '서울 %';
