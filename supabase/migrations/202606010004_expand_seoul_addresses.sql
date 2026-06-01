-- Expand Seoul demo display addresses while keeping region filters as district names.

update public.listings
set address = regexp_replace(address, '^서울 ', '서울특별시 ')
where owner_key like 'owner-%'
  and address like '서울 %';

update public.broker_offices
set address = regexp_replace(address, '^서울 ', '서울특별시 ')
where address like '서울 %';
