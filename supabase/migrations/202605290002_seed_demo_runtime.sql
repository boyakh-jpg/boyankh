-- Seed a usable demo runtime without admin secret keys.
-- Run in Supabase SQL Editor after 202605290001_secure_listings_rls.sql.

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
select 'owner-' || lpad(g::text, 3, '0'), 'owner', '소유주 ' || lpad(g::text, 3, '0'), '소유주 ' || lpad(g::text, 3, '0'), '매물 등록 테스트 소유주',
       (array['Gangnam','Seocho','Songpa','Mapo','Yongsan','Seongdong','Yeongdeungpo','Gwangjin'])[(g - 1) % 8 + 1],
       '010-' || lpad((3100 + g)::text, 4, '0') || '-' || lpad((7000 + g)::text, 4, '0')
from generate_series(1, 20) as g
union all
select 'broker-' || lpad(g::text, 3, '0'), 'broker', '중개사 ' || lpad(g::text, 3, '0'), '중개사 ' || lpad(g::text, 3, '0'), '부동산 상세카드 테스트 중개사',
       (array['Gangnam','Seocho','Songpa','Mapo','Yongsan','Seongdong','Yeongdeungpo','Gwangjin'])[(g - 1) % 8 + 1],
       '010-' || lpad((4100 + g)::text, 4, '0') || '-' || lpad((6000 + g)::text, 4, '0')
from generate_series(1, 30) as g
union all
select 'buyer-' || lpad(g::text, 3, '0'), 'buyer', '직거래 매수자 ' || lpad(g::text, 3, '0'), '직거래 매수자 ' || lpad(g::text, 3, '0'), '직거래 매수 테스트 계정',
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
  region || ' 토드공인중개사 ' || lpad(g::text, 2, '0'),
  '공인중개사 ' || lpad(g::text, 2, '0'),
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
  '지역 수요와 방문 일정을 확인했습니다. 오늘 바로 제안 가능해요.',
  jsonb_build_array(jsonb_build_object('id', 'review-' || id, 'tags', array['빠른 응답','시세 설명'], 'text', '진행 상황을 구체적으로 공유해줬어요.', 'createdAt', '2026-05-29'))
from offices;

with seed as (
  select
    g,
    'listing-' || lpad(g::text, 3, '0') as demo_listing_id,
    'owner-' || lpad((((g - 1) % 20) + 1)::text, 3, '0') as owner_key,
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
  from generate_series(1, 50) as g
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
  '소유주 계정으로 등록된 테스트 매물입니다.',
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
  '직거래 매수자 ' || lpad(((((g - 1) % 10) + 1)::text), 3, '0'),
  case when g % 2 = 0 then '실거주 목적, 대출 사전심사 완료' else '투자 목적, 빠른 잔금 협의 가능' end,
  case when l.deal_type in ('Monthly','Lease') then '월 ' || (120 + g * 3) || '만 가능' else ((l.price_num / 10000) + 1) || '억대 가능' end,
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
