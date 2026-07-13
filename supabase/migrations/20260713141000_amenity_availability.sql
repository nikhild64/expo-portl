create or replace view public.amenity_availability as
select amenity_id, start_at, end_at, status
from amenity_bookings
where status in ('pending', 'confirmed');

grant select on public.amenity_availability to authenticated;

drop policy if exists "amenity_bookings_read_society_availability" on amenity_bookings;
