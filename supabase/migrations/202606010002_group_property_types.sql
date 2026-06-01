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
