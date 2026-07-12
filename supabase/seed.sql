insert into societies (id, name, code, address, city)
values (
  '11111111-1111-1111-1111-111111111111',
  'Prestige Meadows',
  'PRESTIGE-42',
  'Outer Ring Road, Bellandur',
  'Bangalore'
)
on conflict (id) do update
set
  name = excluded.name,
  code = excluded.code,
  address = excluded.address,
  city = excluded.city;

insert into towers (society_id, name, sort_order)
select '11111111-1111-1111-1111-111111111111', tower_name, sort_order
from (values ('A', 1), ('B', 2), ('C', 3), ('D', 4)) as x(tower_name, sort_order)
on conflict (society_id, name) do update
set sort_order = excluded.sort_order;

insert into flats (tower_id, number, floor, bhk)
select
  tw.id,
  format('%s-%s%s', tw.name, floor_number, lpad(unit_number::text, 2, '0')),
  floor_number,
  3
from towers tw
cross join generate_series(1, 5) as floor_number
cross join generate_series(1, 4) as unit_number
where tw.society_id = '11111111-1111-1111-1111-111111111111'
on conflict (tower_id, number) do update
set
  floor = excluded.floor,
  bhk = excluded.bhk;

insert into amenities (
  id,
  society_id,
  name,
  description,
  capacity,
  hourly_price,
  daily_price,
  available_from,
  available_to,
  rules_text
)
values
  (
    '21111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'Community Hall',
    'AC hall with sound system and projector.',
    80,
    500,
    4000,
    '08:00',
    '22:00',
    'Bookings require admin confirmation and a refundable deposit.'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'Swimming Pool',
    'Semi-Olympic pool with lifeguard supervision.',
    30,
    0,
    0,
    '06:00',
    '22:00',
    'Children under 12 must be accompanied by an adult.'
  ),
  (
    '23333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'Gym',
    '24/7 equipped gym with cardio and weights.',
    15,
    0,
    0,
    '00:00',
    '23:59',
    'Wipe equipment after use and carry indoor shoes.'
  )
on conflict (id) do update
set
  name = excluded.name,
  description = excluded.description,
  capacity = excluded.capacity,
  hourly_price = excluded.hourly_price,
  daily_price = excluded.daily_price,
  available_from = excluded.available_from,
  available_to = excluded.available_to,
  rules_text = excluded.rules_text,
  active = true;

insert into staff (id, society_id, name, role, phone, shift_start, shift_end, verified, active)
values
  (
    '31111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'Vikram Singh',
    'guard',
    '+919800000001',
    '08:00',
    '20:00',
    true,
    true
  )
on conflict (id) do update
set
  name = excluded.name,
  role = excluded.role,
  phone = excluded.phone,
  shift_start = excluded.shift_start,
  shift_end = excluded.shift_end,
  verified = excluded.verified,
  active = excluded.active;

insert into service_providers (id, society_id, name, category, phone, verified)
values
  (
    '32222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'QuickFix Plumbing',
    'plumber',
    '+919800000101',
    true
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'BrightSpark Electricals',
    'electrician',
    '+919800000102',
    true
  )
on conflict (id) do update
set
  name = excluded.name,
  category = excluded.category,
  phone = excluded.phone,
  verified = excluded.verified;

insert into dues (society_id, flat_id, period, line_items, total, due_date)
select
  '11111111-1111-1111-1111-111111111111',
  f.id,
  date_trunc('month', current_date)::date,
  jsonb_build_array(
    jsonb_build_object('label', 'Maintenance', 'amount', 6500),
    jsonb_build_object('label', 'Water charges', 'amount', 450),
    jsonb_build_object('label', 'Common electricity', 'amount', 890),
    jsonb_build_object('label', 'Property tax', 'amount', 400)
  ),
  8240,
  (date_trunc('month', current_date) + interval '10 days')::date
from flats f
join towers t on t.id = f.tower_id
where t.society_id = '11111111-1111-1111-1111-111111111111'
on conflict (flat_id, period) do update
set
  line_items = excluded.line_items,
  total = excluded.total,
  due_date = excluded.due_date;
