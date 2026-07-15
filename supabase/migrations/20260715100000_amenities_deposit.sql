-- Per-amenity refundable deposit for bookings (was hardcoded in the app).

alter table public.amenities
  add column if not exists deposit numeric(10, 2) not null default 0
  check (deposit >= 0);

-- Preserve prior app behavior: paid amenities previously charged a flat ₹500 deposit.
update public.amenities
set deposit = 500
where deposit = 0
  and (coalesce(hourly_price, 0) > 0 or coalesce(daily_price, 0) > 0);
