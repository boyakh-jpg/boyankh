-- seed 매물을 한글화하고 소유주 없는 예전 테스트 매물을 삭제한다.

delete from public.listings
where owner_key is null;

with seed as (
  select
    g,
    'listing-' || lpad(g::text, 3, '0') as demo_listing_id,
    (array['강남구','서초구','송파구','마포구','용산구','성동구','영등포구','광진구'])[(g - 1) % 8 + 1] as region,
    (array['역삼동','반포동','잠실동','공덕동','이촌동','성수동','여의도동','광장동'])[(g - 1) % 8 + 1] as dong,
    (array['래미안','자이','힐스테이트','푸르지오','롯데캐슬','더샵','아이파크','르시엘','파크리오','한강뷰'])[(g - 1) % 10 + 1] || ' ' || (((g - 1) % 5) + 1) || '차' as complex,
    (array['아파트','오피스텔','빌라','상가','토지'])[(g - 1) % 5 + 1] as prop_type,
    (array['매매','전세','월세','임대'])[(g - 1) % 4 + 1] as deal_type,
    45000 + (g * 2600) as price_num,
    33 + (((g - 1) % 6) * 13) as area,
    1 + ((g * 3) % 29) as floor
  from generate_series(1, 50) as g
),
korean_seed as (
  select
    *,
    region || ' ' || dong || ' ' || complex as title,
    '서울 ' || region || ' ' || dong as address,
    case
      when deal_type = '월세' then '5,000/' || (80 + (g * 7) % 180) || '만'
      when deal_type = '임대' then '1억/' || (90 + (g * 5) % 160) || '만'
      when price_num % 10000 = 0 then (price_num / 10000) || '억'
      else (price_num / 10000) || '억 ' || to_char(price_num % 10000, 'FM9,999') || '만'
    end as price_label,
    case
      when deal_type = '전세' then '전세완료'
      when deal_type in ('월세','임대') then '임대완료'
      else '매도완료'
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
  move_in_date = case when korean_seed.g % 3 = 0 then '즉시입주' else '협의 가능' end,
  loan = case when korean_seed.g % 4 = 0 then '대출 협의' else '대출 가능' end,
  description = '소유주 계정으로 등록된 실제 구동 테스트 매물입니다.',
  maintenance = '20만원',
  parking = '1대 가능',
  direction = case when korean_seed.g % 2 = 0 then '남향' else '동향' end,
  special = '실제 소유주가 등록한 한글 테스트 매물입니다.',
  tenant = case when korean_seed.g % 4 = 0 then '임차인 있음' else '공실' end,
  tenant_end = case when korean_seed.g % 4 = 0 then '2027년 3월' else null end,
  tenant_deposit = case when korean_seed.g % 4 = 0 then '50000' else null end,
  tenant_monthly = case when korean_seed.g % 4 = 0 then '120' else null end,
  tenant_memo = case when korean_seed.g % 4 = 0 then '임차인 확인 필요' else null end
from korean_seed
where listings.demo_listing_id = korean_seed.demo_listing_id;

update public.broker_proposals as broker_proposals
set listing_title = listings.region || ' ' || listings.dong || ' ' || listings.complex || ' / ' || coalesce(listings.exclusive_area, listings.area)::text || '㎡'
from public.listings as listings
where broker_proposals.listing_id = listings.demo_listing_id
  and listings.demo_listing_id like 'listing-%';

update public.direct_buyer_proposals as direct_buyer_proposals
set listing_title = listings.region || ' ' || listings.dong || ' ' || listings.complex || ' / ' || coalesce(listings.exclusive_area, listings.area)::text || '㎡'
from public.listings as listings
where direct_buyer_proposals.listing_id = listings.demo_listing_id
  and listings.demo_listing_id like 'listing-%';
