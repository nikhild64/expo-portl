-- Security Advisor: security_definer_view (amenity_availability)
-- Use security_invoker so underlying RLS applies to the querying user.
create or replace view public.amenity_availability
with (security_invoker = true)
as
select b.amenity_id, b.start_at, b.end_at, b.status
from amenity_bookings b
inner join amenities a on a.id = b.amenity_id
where b.status in ('pending', 'confirmed')
  and a.society_id = (select my_society_id());

grant select on public.amenity_availability to authenticated;

-- Residents need society-wide booking reads for availability; the view no longer bypasses RLS.
create policy "amenity_bookings_read_society_availability"
on amenity_bookings for select
to authenticated
using (
  exists (
    select 1
    from amenities a
    where a.id = amenity_bookings.amenity_id
      and a.society_id = (select my_society_id())
  )
);

-- Security Advisor: rls_disabled_in_public (profile_audit)
alter table profile_audit enable row level security;
alter table profile_audit force row level security;

create policy "profile_audit_read_admin"
on profile_audit for select
to authenticated
using (
  (select my_role()) = 'admin'
  and exists (
    select 1
    from profiles p
    where p.id = profile_audit.profile_id
      and p.society_id = (select my_society_id())
  )
);
