-- Push delivery for direct notification inserts (e.g. Razorpay payment.captured).
-- Rows inserted by push-fanout persistAndPush set data.pushDispatched = true to skip re-push.

create or replace function public.tg_push_notification_row()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  fanout_url text;
  fanout_key text;
  push_route text;
  push_channel text;
  target_role text;
begin
  if coalesce(NEW.data->>'pushDispatched', 'false') = 'true' then
    return NEW;
  end if;

  select c.fanout_url, c.fanout_key
  into fanout_url, fanout_key
  from public.push_fanout_config c
  where c.id = 1;

  if fanout_url is null or fanout_url = '' then
    return NEW;
  end if;

  select role into target_role from profiles where id = NEW.profile_id;

  push_route := coalesce(
    nullif(NEW.data->>'url', ''),
    case target_role
      when 'admin' then '/(admin)/(dashboard)/notifications'
      when 'guard' then '/(guard)/(home)/notifications'
      else '/(resident)/(home)/notifications'
    end
  );

  push_channel := case
    when NEW.category in ('payment-reminder', 'payments') then 'payments'
    when NEW.category in ('alert', 'complaints') then 'complaints'
    when NEW.category in ('visitors', 'visitor-approval') then 'visitor-approval'
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
        'profile_id', NEW.profile_id,
        'notification_id', NEW.id,
        'title', NEW.title,
        'body', NEW.body,
        'route', push_route,
        'channel_id', push_channel
      ),
      'old_record', null
    ),
    timeout_milliseconds := 3000
  );

  return NEW;
end;
$$;

drop trigger if exists trg_push_notifications on public.notifications;
create trigger trg_push_notifications
  after insert on public.notifications
  for each row execute function public.tg_push_notification_row();

-- enqueue_notification push is now handled by trg_push_notifications.
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
