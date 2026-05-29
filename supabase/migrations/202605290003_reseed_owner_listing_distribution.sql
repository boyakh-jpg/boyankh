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
