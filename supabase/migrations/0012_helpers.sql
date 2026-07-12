create or replace function my_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid();
$$;

create or replace function my_society_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select society_id from profiles where id = auth.uid();
$$;

create or replace function my_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function my_flat_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select flat_id from flat_residents where profile_id = auth.uid();
$$;

create or replace function is_active_in_society(p_society uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from profiles
    where id = auth.uid()
      and society_id = p_society
      and status = 'active'
  );
$$;

revoke all on function my_profile_id() from public, anon;
revoke all on function my_society_id() from public, anon;
revoke all on function my_role() from public, anon;
revoke all on function my_flat_ids() from public, anon;
revoke all on function is_active_in_society(uuid) from public, anon;

grant execute on function my_profile_id() to authenticated, service_role;
grant execute on function my_society_id() to authenticated, service_role;
grant execute on function my_role() to authenticated, service_role;
grant execute on function my_flat_ids() to authenticated, service_role;
grant execute on function is_active_in_society(uuid) to authenticated, service_role;
