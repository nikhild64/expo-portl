-- Direct client upserts on push_tokens fail when the same expo_token row belongs to
-- another profile (common after sign-out / sign-in on one device). RLS USING only
-- allows updates where profile_id = auth.uid(), so ON CONFLICT DO UPDATE is rejected.

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

create or replace function public.deactivate_push_token(p_expo_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  update push_tokens
  set active = false,
      last_seen_at = now()
  where expo_token = p_expo_token;
end;
$$;

revoke all on function public.register_push_token(text, text, text) from public, anon;
grant execute on function public.register_push_token(text, text, text) to authenticated, service_role;

revoke all on function public.deactivate_push_token(text) from public, anon;
grant execute on function public.deactivate_push_token(text) to authenticated, service_role;
