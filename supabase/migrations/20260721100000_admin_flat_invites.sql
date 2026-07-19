-- Allow society admins to manage all family_members invites across their society
create policy "family_members_admin_all"
on family_members for all
to authenticated
using (
  (select my_role()) = 'admin'
  and exists (
    select 1 from profiles p
    where p.id = family_members.profile_id
      and p.society_id = (select my_society_id())
  )
)
with check (
  (select my_role()) = 'admin'
  and exists (
    select 1 from profiles p
    where p.id = family_members.profile_id
      and p.society_id = (select my_society_id())
  )
);

-- Update consume_family_invite to map relation to is_owner and is_head
create or replace function public.consume_family_invite(p_society_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id  uuid := auth.uid();
  v_email    text;
  v_invite   family_members%rowtype;
begin
  select email into v_email from auth.users where id = v_user_id;

  -- Find the invite for this email in the chosen society
  select fm.* into v_invite
  from   family_members fm
  join   profiles p on p.id = fm.profile_id
  where  lower(fm.email) = lower(v_email)
    and  p.society_id = p_society_id
    and  fm.consumed_at is null
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'no_invite');
  end if;

  -- Temporarily bypass the protect_profile_fields trigger
  perform set_config('request.internal_bypass', 'true', true);

  -- Activate profile
  update profiles
  set    status     = 'active',
         society_id = p_society_id,
         updated_at = now()
  where  id = v_user_id;

  -- Clear the bypass flag
  perform set_config('request.internal_bypass', 'false', true);

  -- Link to flat with role mapping from relation
  if v_invite.flat_id is not null then
    insert into flat_residents (flat_id, profile_id, is_owner, is_head)
    values (
      v_invite.flat_id,
      v_user_id,
      lower(coalesce(v_invite.relation, '')) in ('owner', 'owner & head', 'owner_head'),
      lower(coalesce(v_invite.relation, '')) in ('head', 'head of family', 'head_of_family', 'owner & head', 'owner_head')
    )
    on conflict (flat_id, profile_id) do update
    set is_owner = excluded.is_owner or flat_residents.is_owner,
        is_head = excluded.is_head or flat_residents.is_head;
  end if;

  -- Consume invite
  update family_members
  set    consumed_at = now()
  where  id = v_invite.id;

  return jsonb_build_object('ok', true, 'flat_id', v_invite.flat_id);
end;
$$;
