-- Security Advisor warnings: search_path, extension schema, internal function grants.

-- 0011: pin search_path on trigger functions.
create or replace function public.complaints_audit_stamp()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_by = auth.uid();
  return new;
end;
$$;

create or replace function public.profiles_audit_stamp()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  new.updated_by = auth.uid();
  return new;
end;
$$;

create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (select auth.uid()) is not null
     and (select my_role()) <> 'admin' then
    new.role := old.role;
    new.status := old.status;
    if old.society_id is not null then
      new.society_id := old.society_id;
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.protect_visitor_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (select my_role()) = 'resident' then
    new.guard_id := old.guard_id;
    new.entered_at := old.entered_at;
    new.exited_at := old.exited_at;
    new.guard_note := old.guard_note;

    if old.status is distinct from new.status then
      if not (old.status = 'pending' and new.status in ('approved', 'rejected')) then
        new.status := old.status;
        new.decided_at := old.decided_at;
        new.decided_by := old.decided_by;
      end if;
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.protect_complaint_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (select my_role()) = 'resident' then
    if old.raised_by = (select auth.uid())
       and old.status in ('new', 'assigned', 'in_progress', 'resolved')
       and new.status = 'closed'
    then
      new.priority := old.priority;
      new.assigned_to := old.assigned_to;
      new.assigned_service_provider_id := old.assigned_service_provider_id;
      new.resolved_at := coalesce(old.resolved_at, now());
      return new;
    end if;

    new.status := old.status;
    new.priority := old.priority;
    new.assigned_to := old.assigned_to;
    new.assigned_service_provider_id := old.assigned_service_provider_id;
  end if;
  return new;
end;
$$;

create or replace function public.check_booking_overlap()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if exists (
    select 1
    from amenity_bookings
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

-- pg_net is non-relocatable on managed Supabase (extrelocatable = false).
-- Its callable objects live in the `net` schema, not `public`; treat
-- extension_in_public as an accepted platform exception.

-- 0028/0029: move trigger/cron SECURITY DEFINER functions out of the exposed API schema.
-- PostgREST only exposes `public`; triggers keep EXECUTE for authenticated.
create schema if not exists private;
grant usage on schema private to authenticated, service_role;

alter function public.profiles_role_audit() set schema private;
alter function public.tg_push_fanout() set schema private;
alter function public.tg_push_notification_row() set schema private;
alter function public.generate_monthly_dues_cycles() set schema private;

revoke all on function private.profiles_role_audit() from public, anon;
grant execute on function private.profiles_role_audit() to authenticated, service_role;

revoke all on function private.tg_push_fanout() from public, anon;
grant execute on function private.tg_push_fanout() to authenticated, service_role;

revoke all on function private.tg_push_notification_row() from public, anon;
grant execute on function private.tg_push_notification_row() to authenticated, service_role;

revoke all on function private.generate_monthly_dues_cycles() from public, anon, authenticated;
grant execute on function private.generate_monthly_dues_cycles() to service_role;

do $outer$
declare
  jid int;
begin
  select jobid into jid from cron.job where jobname = 'monthly-dues';
  if jid is not null then
    perform cron.unschedule(jid);
  end if;
end;
$outer$;

select cron.schedule(
  'monthly-dues',
  '0 3 1 * *',
  $$select private.generate_monthly_dues_cycles()$$
);

-- Admin-only RPC: block anonymous callers explicitly.
revoke all on function public.generate_dues_cycle(uuid, date, jsonb, numeric, date) from anon;
