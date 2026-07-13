-- M7 push fan-out webhooks.
--
-- This migration installs pg_net and creates database triggers that POST row
-- payloads to the `push-fanout` Edge Function, matching Supabase Database
-- Webhooks semantics (`{ type, table, schema, record, old_record }`).
--
-- Configuration lives in two database-level GUCs so the same migration works
-- across environments. After deploying the function, run:
--
--   alter database postgres set app.push_fanout_url = 'https://<project-ref>.supabase.co/functions/v1/push-fanout';
--   alter database postgres set app.push_fanout_key = '<service-role-key>';
--
-- Until both settings are non-empty the trigger is a no-op — safe to run this
-- migration in any environment. Alternatively skip this migration entirely and
-- configure the same webhooks in Supabase Studio → Database → Webhooks (the
-- Studio UI writes the same pg_net-based triggers under the hood).

create extension if not exists pg_net;

create or replace function public.tg_push_fanout()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  fanout_url text := current_setting('app.push_fanout_url', true);
  fanout_key text := current_setting('app.push_fanout_key', true);
  payload jsonb;
begin
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

drop trigger if exists trg_push_visitors on public.visitors;
create trigger trg_push_visitors
  after insert or update on public.visitors
  for each row execute function public.tg_push_fanout();

drop trigger if exists trg_push_notices on public.notices;
create trigger trg_push_notices
  after insert on public.notices
  for each row execute function public.tg_push_fanout();

drop trigger if exists trg_push_complaints on public.complaints;
create trigger trg_push_complaints
  after insert or update on public.complaints
  for each row execute function public.tg_push_fanout();

drop trigger if exists trg_push_complaint_updates on public.complaint_updates;
create trigger trg_push_complaint_updates
  after insert on public.complaint_updates
  for each row execute function public.tg_push_fanout();

drop trigger if exists trg_push_dues on public.dues;
create trigger trg_push_dues
  after insert on public.dues
  for each row execute function public.tg_push_fanout();
