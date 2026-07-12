create policy "societies_update_admin"
on societies for update
to authenticated
using ((select my_role()) = 'admin' and id = (select my_society_id()))
with check (id = (select my_society_id()));

create policy "towers_admin_all"
on towers for all
to authenticated
using ((select my_role()) = 'admin' and society_id = (select my_society_id()))
with check ((select my_role()) = 'admin' and society_id = (select my_society_id()));

create policy "flats_admin_all"
on flats for all
to authenticated
using (
  (select my_role()) = 'admin'
  and exists (
    select 1 from towers t
    where t.id = flats.tower_id
      and t.society_id = (select my_society_id())
  )
)
with check (
  (select my_role()) = 'admin'
  and exists (
    select 1 from towers t
    where t.id = flats.tower_id
      and t.society_id = (select my_society_id())
  )
);

create policy "profiles_insert_self"
on profiles for insert
to authenticated
with check (id = (select auth.uid()));

create policy "profiles_update_own"
on profiles for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy "profiles_update_admin"
on profiles for update
to authenticated
using ((select my_role()) = 'admin' and society_id = (select my_society_id()))
with check (society_id = (select my_society_id()));

create policy "flat_residents_insert_self"
on flat_residents for insert
to authenticated
with check (
  profile_id = (select auth.uid())
  and exists (
    select 1
    from flats f
    join towers t on t.id = f.tower_id
    where f.id = flat_residents.flat_id
      and t.society_id = (select my_society_id())
  )
);

create policy "flat_residents_admin_all"
on flat_residents for all
to authenticated
using (
  (select my_role()) = 'admin'
  and exists (
    select 1
    from flats f
    join towers t on t.id = f.tower_id
    where f.id = flat_residents.flat_id
      and t.society_id = (select my_society_id())
  )
)
with check (
  (select my_role()) = 'admin'
  and exists (
    select 1
    from flats f
    join towers t on t.id = f.tower_id
    where f.id = flat_residents.flat_id
      and t.society_id = (select my_society_id())
  )
);

create policy "family_members_manage_own"
on family_members for all
to authenticated
using (profile_id = (select auth.uid()))
with check (profile_id = (select auth.uid()));

create policy "vehicles_manage_flat"
on vehicles for all
to authenticated
using (flat_id in (select my_flat_ids()))
with check (flat_id in (select my_flat_ids()));

create policy "vehicles_admin_all"
on vehicles for all
to authenticated
using (
  (select my_role()) = 'admin'
  and exists (
    select 1
    from flats f
    join towers t on t.id = f.tower_id
    where f.id = vehicles.flat_id
      and t.society_id = (select my_society_id())
  )
)
with check (
  (select my_role()) = 'admin'
  and exists (
    select 1
    from flats f
    join towers t on t.id = f.tower_id
    where f.id = vehicles.flat_id
      and t.society_id = (select my_society_id())
  )
);

create policy "pre_approvals_manage_creator"
on pre_approvals for all
to authenticated
using (created_by_profile_id = (select auth.uid()))
with check (
  created_by_profile_id = (select auth.uid())
  and flat_id in (select my_flat_ids())
);

create policy "pre_approvals_admin_all"
on pre_approvals for all
to authenticated
using (
  (select my_role()) = 'admin'
  and exists (
    select 1
    from flats f
    join towers t on t.id = f.tower_id
    where f.id = pre_approvals.flat_id
      and t.society_id = (select my_society_id())
  )
)
with check (
  (select my_role()) = 'admin'
  and exists (
    select 1
    from flats f
    join towers t on t.id = f.tower_id
    where f.id = pre_approvals.flat_id
      and t.society_id = (select my_society_id())
  )
);

create policy "visitors_insert_guard"
on visitors for insert
to authenticated
with check (
  (select my_role()) = 'guard'
  and society_id = (select my_society_id())
  and guard_id = (select auth.uid())
);

create policy "visitors_update_resident"
on visitors for update
to authenticated
using (flat_id in (select my_flat_ids()))
with check (flat_id in (select my_flat_ids()));

create policy "visitors_update_guard"
on visitors for update
to authenticated
using ((select my_role()) = 'guard' and society_id = (select my_society_id()))
with check (society_id = (select my_society_id()));

create policy "visitors_admin_all"
on visitors for all
to authenticated
using ((select my_role()) = 'admin' and society_id = (select my_society_id()))
with check ((select my_role()) = 'admin' and society_id = (select my_society_id()));

create policy "notices_admin_all"
on notices for all
to authenticated
using ((select my_role()) = 'admin' and society_id = (select my_society_id()))
with check ((select my_role()) = 'admin' and society_id = (select my_society_id()));

create policy "notice_reactions_manage_own"
on notice_reactions for all
to authenticated
using (profile_id = (select auth.uid()))
with check (profile_id = (select auth.uid()));

create policy "notice_reads_manage_own"
on notice_reads for all
to authenticated
using (profile_id = (select auth.uid()))
with check (profile_id = (select auth.uid()));

create policy "polls_admin_all"
on polls for all
to authenticated
using ((select my_role()) = 'admin' and society_id = (select my_society_id()))
with check ((select my_role()) = 'admin' and society_id = (select my_society_id()));

create policy "poll_votes_manage_own"
on poll_votes for all
to authenticated
using (profile_id = (select auth.uid()))
with check (profile_id = (select auth.uid()));

create policy "poll_comments_insert_own"
on poll_comments for insert
to authenticated
with check (
  profile_id = (select auth.uid())
  and exists (
    select 1 from polls p
    where p.id = poll_comments.poll_id
      and p.society_id = (select my_society_id())
  )
);

create policy "poll_comments_delete_own"
on poll_comments for delete
to authenticated
using (profile_id = (select auth.uid()));

create policy "poll_comments_delete_admin"
on poll_comments for delete
to authenticated
using (
  (select my_role()) = 'admin'
  and exists (
    select 1 from polls p
    where p.id = poll_comments.poll_id
      and p.society_id = (select my_society_id())
  )
);

create policy "amenities_admin_all"
on amenities for all
to authenticated
using ((select my_role()) = 'admin' and society_id = (select my_society_id()))
with check ((select my_role()) = 'admin' and society_id = (select my_society_id()));

create policy "amenity_bookings_insert_own"
on amenity_bookings for insert
to authenticated
with check (
  profile_id = (select auth.uid())
  and flat_id in (select my_flat_ids())
);

create policy "amenity_bookings_update_own_pending"
on amenity_bookings for update
to authenticated
using (profile_id = (select auth.uid()) and status = 'pending')
with check (profile_id = (select auth.uid()));

create policy "amenity_bookings_admin_all"
on amenity_bookings for all
to authenticated
using (
  (select my_role()) = 'admin'
  and exists (
    select 1 from amenities a
    where a.id = amenity_bookings.amenity_id
      and a.society_id = (select my_society_id())
  )
)
with check (
  (select my_role()) = 'admin'
  and exists (
    select 1 from amenities a
    where a.id = amenity_bookings.amenity_id
      and a.society_id = (select my_society_id())
  )
);

create policy "complaints_insert_resident"
on complaints for insert
to authenticated
with check (
  raised_by = (select auth.uid())
  and flat_id in (select my_flat_ids())
  and society_id = (select my_society_id())
);

create policy "complaints_update_resident_own"
on complaints for update
to authenticated
using (raised_by = (select auth.uid()))
with check (raised_by = (select auth.uid()));

create policy "complaints_update_assignee_admin"
on complaints for update
to authenticated
using (
  assigned_to = (select auth.uid())
  or ((select my_role()) = 'admin' and society_id = (select my_society_id()))
)
with check (society_id = (select my_society_id()));

create policy "complaints_delete_admin"
on complaints for delete
to authenticated
using ((select my_role()) = 'admin' and society_id = (select my_society_id()));

create policy "complaint_updates_insert_related_or_admin"
on complaint_updates for insert
to authenticated
with check (
  profile_id = (select auth.uid())
  and exists (
    select 1 from complaints c
    where c.id = complaint_updates.complaint_id
      and (
        c.raised_by = (select auth.uid())
        or c.assigned_to = (select auth.uid())
        or ((select my_role()) = 'admin' and c.society_id = (select my_society_id()))
      )
  )
);

create policy "staff_admin_all"
on staff for all
to authenticated
using ((select my_role()) = 'admin' and society_id = (select my_society_id()))
with check ((select my_role()) = 'admin' and society_id = (select my_society_id()));

create policy "service_providers_admin_all"
on service_providers for all
to authenticated
using ((select my_role()) = 'admin' and society_id = (select my_society_id()))
with check ((select my_role()) = 'admin' and society_id = (select my_society_id()));

create policy "dues_admin_all"
on dues for all
to authenticated
using ((select my_role()) = 'admin' and society_id = (select my_society_id()))
with check ((select my_role()) = 'admin' and society_id = (select my_society_id()));

create policy "push_tokens_manage_own"
on push_tokens for all
to authenticated
using (profile_id = (select auth.uid()))
with check (profile_id = (select auth.uid()));

create policy "notifications_insert_intra_society"
on notifications for insert
to authenticated
with check (
  (select my_role()) in ('admin', 'guard')
  and profile_id in (
    select id from profiles
    where society_id = (select my_society_id())
  )
);

create policy "notifications_update_own"
on notifications for update
to authenticated
using (profile_id = (select auth.uid()))
with check (profile_id = (select auth.uid()));
