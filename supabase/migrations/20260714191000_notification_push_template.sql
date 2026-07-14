-- Forward notification template metadata to push-fanout for localized push delivery.

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
  push_record jsonb;
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

  push_record := jsonb_build_object(
    'profile_id', NEW.profile_id,
    'notification_id', NEW.id,
    'title', NEW.title,
    'body', NEW.body,
    'route', push_route,
    'channel_id', push_channel
  );

  if NEW.data ? 'template' then
    push_record := push_record || jsonb_build_object(
      'template', NEW.data->>'template',
      'params', coalesce(NEW.data->'params', '{}'::jsonb)
    );
  end if;

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
      'record', push_record,
      'old_record', null
    ),
    timeout_milliseconds := 3000
  );

  return NEW;
end;
$$;
