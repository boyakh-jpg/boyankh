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
  address = '서울 ' || listing_seed.region || ' ' || listing_seed.dong || ' ' || listing_seed.complex,
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
  address = '서울 ' || office_seed.region || ' ' || office_seed.dong || ' ' || (100 + office_seed.g),
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
