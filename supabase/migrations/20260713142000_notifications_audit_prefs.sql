-- A5: revoke client notification inserts; route via enqueue_notification RPC.
drop policy if exists "notifications_insert_intra_society" on notifications;

create or replace function public.enqueue_notification(
  p_profile_id uuid,
  p_category text,
  p_title text,
  p_body text,
  p_data jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  target_society uuid;
  caller_role user_role;
begin
  caller_role := (select my_role());
  select society_id into target_society from profiles where id = p_profile_id;

  if caller_role = 'admin' and target_society = (select my_society_id()) then
    null;
  elsif caller_role = 'guard' then
    if not exists (
      select 1
      from profiles
      where id = p_profile_id
        and role = 'admin'
        and society_id = (select my_society_id())
    ) then
      raise exception 'not authorized';
    end if;
  else
    raise exception 'not authorized';
  end if;

  insert into notifications (profile_id, category, title, body, data)
  values (p_profile_id, p_category, p_title, p_body, p_data)
  returning id into new_id;

  return new_id;
end;
$$;

revoke all on function public.enqueue_notification(uuid, text, text, text, jsonb) from public, anon;
grant execute on function public.enqueue_notification(uuid, text, text, text, jsonb) to authenticated, service_role;

-- A7: profile audit trail.
alter table profiles
  add column if not exists updated_by uuid references profiles(id) on delete set null;

create table if not exists profile_audit (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  changed_by uuid references profiles(id) on delete set null,
  old_role user_role,
  new_role user_role,
  old_status user_status,
  new_status user_status,
  created_at timestamptz not null default now()
);

create index if not exists idx_profile_audit_profile on profile_audit(profile_id, created_at desc);

create or replace function public.profiles_audit_stamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  new.updated_by = auth.uid();
  return new;
end;
$$;

drop trigger if exists profiles_audit_stamp on profiles;
create trigger profiles_audit_stamp
before update on profiles
for each row
execute function public.profiles_audit_stamp();

create or replace function public.profiles_role_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role is distinct from new.role or old.status is distinct from new.status then
    insert into profile_audit (profile_id, changed_by, old_role, new_role, old_status, new_status)
    values (new.id, auth.uid(), old.role, new.role, old.status, new.status);
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_role_audit on profiles;
create trigger profiles_role_audit
after update on profiles
for each row
execute function public.profiles_role_audit();

-- B9: server-side notification preferences.
create table if not exists notification_preferences (
  profile_id uuid primary key references profiles(id) on delete cascade,
  visitors boolean not null default true,
  notices boolean not null default true,
  payments boolean not null default true,
  complaints boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table notification_preferences enable row level security;

create policy "notification_preferences_select_own"
on notification_preferences for select
to authenticated
using (profile_id = (select auth.uid()));

create policy "notification_preferences_manage_own"
on notification_preferences for all
to authenticated
using (profile_id = (select auth.uid()))
with check (profile_id = (select auth.uid()));
