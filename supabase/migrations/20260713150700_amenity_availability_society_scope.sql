-- Scope amenity_availability to the caller's society.
-- Residents still see all booked slots in their society; other societies are hidden.
create or replace view public.amenity_availability as
select b.amenity_id, b.start_at, b.end_at, b.status
from amenity_bookings b
inner join amenities a on a.id = b.amenity_id
where b.status in ('pending', 'confirmed')
  and a.society_id = (select my_society_id());

grant select on public.amenity_availability to authenticated;
