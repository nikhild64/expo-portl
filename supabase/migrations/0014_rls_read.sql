create policy "societies_read_own"
on societies for select
to authenticated
using (id = (select my_society_id()));

create policy "towers_read_society"
on towers for select
to authenticated
using (society_id = (select my_society_id()));

create policy "flats_read_society"
on flats for select
to authenticated
using (
  exists (
    select 1 from towers t
    where t.id = flats.tower_id
      and t.society_id = (select my_society_id())
  )
);

create policy "profiles_read_own"
on profiles for select
to authenticated
using (id = (select auth.uid()));

create policy "profiles_read_society_members"
on profiles for select
to authenticated
using (society_id = (select my_society_id()));

create policy "flat_residents_read_society"
on flat_residents for select
to authenticated
using (
  exists (
    select 1
    from flats f
    join towers t on t.id = f.tower_id
    where f.id = flat_residents.flat_id
      and t.society_id = (select my_society_id())
  )
);

create policy "family_members_read_own"
on family_members for select
to authenticated
using (profile_id = (select auth.uid()));

create policy "family_members_read_admin"
on family_members for select
to authenticated
using (
  (select my_role()) = 'admin'
  and exists (
    select 1 from profiles p
    where p.id = family_members.profile_id
      and p.society_id = (select my_society_id())
  )
);

create policy "vehicles_read_flat_or_society_ops"
on vehicles for select
to authenticated
using (
  flat_id in (select my_flat_ids())
  or (
    (select my_role()) in ('admin', 'guard')
    and exists (
      select 1
      from flats f
      join towers t on t.id = f.tower_id
      where f.id = vehicles.flat_id
        and t.society_id = (select my_society_id())
    )
  )
);

create policy "pre_approvals_read_creator_or_ops"
on pre_approvals for select
to authenticated
using (
  created_by_profile_id = (select auth.uid())
  or (
    (select my_role()) in ('admin', 'guard')
    and exists (
      select 1
      from flats f
      join towers t on t.id = f.tower_id
      where f.id = pre_approvals.flat_id
        and t.society_id = (select my_society_id())
    )
  )
);

create policy "visitors_read_flat_or_ops"
on visitors for select
to authenticated
using (
  society_id = (select my_society_id())
  and (
    (select my_role()) in ('admin', 'guard')
    or flat_id in (select my_flat_ids())
  )
);

create policy "notices_read_society_audience"
on notices for select
to authenticated
using (
  society_id = (select my_society_id())
  and published_at is not null
  and (
    (select my_role()) in ('admin', 'guard')
    or target_audience->>'kind' = 'all'
    or (
      target_audience->>'kind' = 'towers'
      and exists (
        select 1
        from flat_residents fr
        join flats f on f.id = fr.flat_id
        where fr.profile_id = (select auth.uid())
          and f.tower_id::text in (select jsonb_array_elements_text(target_audience->'ids'))
      )
    )
    or (
      target_audience->>'kind' = 'flats'
      and exists (
        select 1
        from flat_residents fr
        where fr.profile_id = (select auth.uid())
          and fr.flat_id::text in (select jsonb_array_elements_text(target_audience->'ids'))
      )
    )
  )
);

create policy "notice_reactions_read_society"
on notice_reactions for select
to authenticated
using (
  exists (
    select 1 from notices n
    where n.id = notice_reactions.notice_id
      and n.society_id = (select my_society_id())
  )
);

create policy "notice_reads_read_own_or_admin"
on notice_reads for select
to authenticated
using (
  profile_id = (select auth.uid())
  or (
    (select my_role()) = 'admin'
    and exists (
      select 1 from notices n
      where n.id = notice_reads.notice_id
        and n.society_id = (select my_society_id())
    )
  )
);

create policy "polls_read_society"
on polls for select
to authenticated
using (society_id = (select my_society_id()));

create policy "poll_votes_read_results"
on poll_votes for select
to authenticated
using (
  exists (
    select 1 from polls p
    where p.id = poll_votes.poll_id
      and p.society_id = (select my_society_id())
      and (p.show_results or (select my_role()) = 'admin')
  )
);

create policy "poll_comments_read_society"
on poll_comments for select
to authenticated
using (
  exists (
    select 1 from polls p
    where p.id = poll_comments.poll_id
      and p.society_id = (select my_society_id())
  )
);

create policy "amenities_read_society"
on amenities for select
to authenticated
using (society_id = (select my_society_id()));

create policy "amenity_bookings_read_own_or_admin"
on amenity_bookings for select
to authenticated
using (
  profile_id = (select auth.uid())
  or (
    (select my_role()) = 'admin'
    and exists (
      select 1 from amenities a
      where a.id = amenity_bookings.amenity_id
        and a.society_id = (select my_society_id())
    )
  )
);

create policy "complaints_read_related_or_admin"
on complaints for select
to authenticated
using (
  raised_by = (select auth.uid())
  or assigned_to = (select auth.uid())
  or ((select my_role()) = 'admin' and society_id = (select my_society_id()))
);

create policy "complaint_updates_read_related_or_admin"
on complaint_updates for select
to authenticated
using (
  exists (
    select 1 from complaints c
    where c.id = complaint_updates.complaint_id
      and (
        c.raised_by = (select auth.uid())
        or c.assigned_to = (select auth.uid())
        or ((select my_role()) = 'admin' and c.society_id = (select my_society_id()))
      )
  )
);

create policy "staff_read_society"
on staff for select
to authenticated
using (society_id = (select my_society_id()));

create policy "service_providers_read_society"
on service_providers for select
to authenticated
using (society_id = (select my_society_id()));

create policy "dues_read_flat_or_admin"
on dues for select
to authenticated
using (
  flat_id in (select my_flat_ids())
  or ((select my_role()) = 'admin' and society_id = (select my_society_id()))
);

create policy "payments_read_own_or_admin"
on payments for select
to authenticated
using (
  profile_id = (select auth.uid())
  or ((select my_role()) = 'admin' and society_id = (select my_society_id()))
);

create policy "push_tokens_read_own"
on push_tokens for select
to authenticated
using (profile_id = (select auth.uid()));

create policy "notifications_read_own"
on notifications for select
to authenticated
using (profile_id = (select auth.uid()));

create policy "audit_log_read_admin"
on audit_log for select
to authenticated
using ((select my_role()) = 'admin' and society_id = (select my_society_id()));
