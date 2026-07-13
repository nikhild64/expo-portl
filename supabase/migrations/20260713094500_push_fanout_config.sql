-- Option B push fan-out: config table (works on hosted Supabase).
--
-- `alter database ... set app.push_fanout_*` requires superuser on custom GUCs,
-- which the Supabase SQL Editor does not have. Store URL + auth key in a
-- singleton row instead; triggers stay dormant until both values are set.
--
-- After deploying push-fanout and setting PUSH_FANOUT_SECRET on the function:
--
--   update public.push_fanout_config
--   set
--     fanout_url = 'https://<project-ref>.supabase.co/functions/v1/push-fanout',
--     fanout_key = '<same value as PUSH_FANOUT_SECRET>',
--     updated_at = now()
--   where id = 1;
--
-- Do not also create Studio Database Webhooks for the same tables — duplicates.

create table if not exists public.push_fanout_config (
  id smallint primary key default 1 check (id = 1),
  fanout_url text not null default '',
  fanout_key text not null default '',
  updated_at timestamptz not null default now()
);

insert into public.push_fanout_config (id, fanout_url, fanout_key)
values (1, '', '')
on conflict (id) do nothing;

alter table public.push_fanout_config enable row level security;

revoke all on table public.push_fanout_config from anon, authenticated;

create or replace function public.tg_push_fanout()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  fanout_url text;
  fanout_key text;
  payload jsonb;
begin
  select c.fanout_url, c.fanout_key
  into fanout_url, fanout_key
  from public.push_fanout_config c
  where c.id = 1;

  if fanout_url is null or fanout_url = '' then
    return coalesce(NEW, OLD);
  end if;

  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record', case when TG_OP = 'DELETE' then null else to_jsonb(NEW) end,
    'old_record', case when TG_OP in ('UPDATE', 'DELETE') then to_jsonb(OLD) else null end
  );

  perform net.http_post(
    url := fanout_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', case when fanout_key = '' then '' else 'Bearer ' || fanout_key end
    ),
    body := payload,
    timeout_milliseconds := 3000
  );

  return coalesce(NEW, OLD);
end;
$$;
