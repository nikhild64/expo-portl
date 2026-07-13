create or replace function check_booking_overlap()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1 from amenity_bookings
    where amenity_id = new.amenity_id
      and id <> new.id
      and status not in ('cancelled', 'failed')
      and tstzrange(start_at, end_at) && tstzrange(new.start_at, new.end_at)
  ) then
    raise exception 'booking_overlap' using hint = 'Another booking overlaps this time slot';
  end if;
  return new;
end;
$$;

drop trigger if exists tg_check_booking_overlap on amenity_bookings;
create trigger tg_check_booking_overlap
before insert or update on amenity_bookings
for each row
when (new.status not in ('cancelled', 'failed'))
execute function check_booking_overlap();

update amenity_bookings b
set status = 'failed'
from payments p
where p.reference_id = b.id
  and p.purpose = 'amenity'
  and p.status = 'failed'
  and b.status in ('cancelled', 'pending');

update amenity_bookings b
set payment_id = p.id
from payments p
where p.reference_id = b.id
  and p.purpose = 'amenity'
  and b.payment_id is null;
