create table amenities (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies(id) on delete cascade,
  name text not null,
  description text,
  capacity int,
  hourly_price numeric(10, 2) default 0,
  daily_price numeric(10, 2) default 0,
  cover_image_url text,
  rules_text text,
  available_from time not null default '06:00',
  available_to time not null default '22:00',
  blackout_dates date[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (available_to > available_from)
);

create index idx_amenities_society on amenities(society_id);

create table amenity_bookings (
  id uuid primary key default gen_random_uuid(),
  amenity_id uuid not null references amenities(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  flat_id uuid not null references flats(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  total_amount numeric(10, 2) not null,
  deposit numeric(10, 2) not null default 0,
  status booking_status not null default 'pending',
  payment_id uuid,
  created_at timestamptz not null default now(),
  check (end_at > start_at),
  check (total_amount >= 0),
  check (deposit >= 0)
);

create index idx_bookings_amenity_time on amenity_bookings(amenity_id, start_at);
create index idx_bookings_profile on amenity_bookings(profile_id, start_at desc);
create index idx_bookings_flat on amenity_bookings(flat_id, start_at desc);
