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
