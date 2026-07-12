-- M4 resident app policy fixes.
-- Existing policies let creators/admins read these rows, but resident flows need
-- co-resident pre-approval visibility and same-society booking availability.

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'pre_approvals'
      and policyname = 'pre_approvals_read_my_flats'
  ) then
    create policy "pre_approvals_read_my_flats"
    on pre_approvals for select
    to authenticated
    using (flat_id in (select my_flat_ids()));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'amenity_bookings'
      and policyname = 'amenity_bookings_read_society_availability'
  ) then
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
  end if;
end
$$;
