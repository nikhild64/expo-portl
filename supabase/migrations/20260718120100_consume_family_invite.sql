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

  -- Activate profile
  update profiles
  set    status     = 'active',
         society_id = p_society_id,
         updated_at = now()
  where  id = v_user_id;

  -- Link to flat
  if v_invite.flat_id is not null then
    insert into flat_residents (flat_id, profile_id, is_owner, is_head)
    values (v_invite.flat_id, v_user_id, false, false)
    on conflict do nothing;
  end if;

  -- Consume invite
  update family_members
  set    consumed_at = now()
  where  id = v_invite.id;

  return jsonb_build_object('ok', true, 'flat_id', v_invite.flat_id);
end;
$$;

revoke all on function public.consume_family_invite(uuid) from public, anon;
grant execute on function public.consume_family_invite(uuid) to authenticated;
