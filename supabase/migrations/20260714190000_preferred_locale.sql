-- Store user language preference for localized push notifications.

alter table public.profiles
  add column if not exists preferred_locale text not null default 'en'
  check (preferred_locale in ('en', 'hi'));

create or replace function public.update_preferred_locale(p_locale text)
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

  if p_locale not in ('en', 'hi') then
    raise exception 'invalid locale';
  end if;

  update public.profiles
  set preferred_locale = p_locale
  where id = uid;
end;
$$;

revoke all on function public.update_preferred_locale(text) from public, anon;
grant execute on function public.update_preferred_locale(text) to authenticated, service_role;
