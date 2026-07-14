-- Keep one active Expo token per profile so reinstall / FCM rotation does not leave
-- stale rows that push-fanout and push:test still target.

create or replace function public.register_push_token(
  p_expo_token text,
  p_device_id text default null,
  p_platform text default 'android'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  update push_tokens
  set active = false,
      last_seen_at = now()
  where profile_id = uid
    and expo_token <> p_expo_token
    and active;

  insert into push_tokens (profile_id, expo_token, device_id, platform, active, last_seen_at)
  values (uid, p_expo_token, p_device_id, coalesce(p_platform, 'android'), true, now())
  on conflict (expo_token) do update
    set profile_id = uid,
        device_id = excluded.device_id,
        platform = excluded.platform,
        active = true,
        last_seen_at = now();
end;
$$;
