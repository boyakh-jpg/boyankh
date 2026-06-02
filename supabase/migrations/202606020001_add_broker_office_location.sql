alter table public.broker_offices add column if not exists city text;
alter table public.broker_offices add column if not exists dong text;
alter table public.broker_offices add column if not exists lat double precision;
alter table public.broker_offices add column if not exists lng double precision;

create index if not exists broker_offices_region_dong_idx
on public.broker_offices (region, dong);

create index if not exists broker_offices_lat_lng_idx
on public.broker_offices (lat, lng);

with office_numbers as (
  select
    id,
    coalesce(nullif(regexp_replace(id, '\D', '', 'g'), '')::integer, 0) as n
  from public.broker_offices
)
update public.broker_offices as offices
set
  city = coalesce(nullif(offices.city, ''), nullif(split_part(offices.address, ' ', 1), '')),
  dong = coalesce(nullif(offices.dong, ''), nullif(split_part(offices.address, ' ', 3), '')),
  lat = coalesce(offices.lat, 37.45 + ((office_numbers.n % 35) * 0.004)),
  lng = coalesce(offices.lng, 126.85 + ((office_numbers.n % 45) * 0.004))
from office_numbers
where offices.id = office_numbers.id
  and (
    offices.city is null
    or offices.dong is null
    or offices.lat is null
    or offices.lng is null
  );
