-- Complaint actor tracking + push delivery for enqueue_notification RPC.

alter table public.complaints
  add column if not exists updated_by uuid references public.profiles(id) on delete set null;

create or replace function public.complaints_audit_stamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_by = auth.uid();
  return new;
end;
$$;

drop trigger if exists tg_complaints_audit_stamp on public.complaints;
create trigger tg_complaints_audit_stamp
before update on public.complaints
for each row
execute function public.complaints_audit_stamp();

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
  fanout_url text;
  fanout_key text;
  push_route text;
  push_channel text;
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

  select c.fanout_url, c.fanout_key
  into fanout_url, fanout_key
  from public.push_fanout_config c
  where c.id = 1;

  if fanout_url is null or fanout_url = '' then
    return new_id;
  end if;

  push_route := coalesce(nullif(p_data->>'url', ''), '/(admin)/(dashboard)/notifications');
  push_channel := case
    when p_category in ('payment-reminder', 'payments') then 'payments'
    when p_category in ('alert', 'complaints') then 'complaints'
    when p_category = 'visitors' then 'visitor-approval'
    else 'notices'
  end;

  perform net.http_post(
    url := fanout_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', case when fanout_key = '' then '' else 'Bearer ' || fanout_key end
    ),
    body := jsonb_build_object(
      'type', 'PUSH',
      'table', '_push_only',
      'schema', 'public',
      'record', jsonb_build_object(
        'profile_id', p_profile_id,
        'notification_id', new_id,
        'title', p_title,
        'body', p_body,
        'route', push_route,
        'channel_id', push_channel
      ),
      'old_record', null
    ),
    timeout_milliseconds := 3000
  );

  return new_id;
end;
$$;
