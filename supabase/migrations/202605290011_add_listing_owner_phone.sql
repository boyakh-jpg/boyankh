-- Store listing owner contact numbers in the database.

alter table public.listings
add column if not exists owner_phone text;

update public.listings as listings
set owner_phone = demo_users.phone
from public.demo_users as demo_users
where listings.owner_key = demo_users.id
  and demo_users.role = 'owner'
  and (listings.owner_phone is null or listings.owner_phone = '');
