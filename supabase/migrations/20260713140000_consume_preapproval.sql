create or replace function public.consume_preapproval(p_code text)
returns table(visitor_id uuid, valid boolean, reason text)
language plpgsql
security definer
set search_path = public
as $$
declare
  r pre_approvals%rowtype;
  preapproval_society uuid;
  new_id uuid;
  guard_id uuid;
begin
  if (select my_role()) not in ('guard', 'admin') then
    return query select null::uuid, false, 'not_authorized';
    return;
  end if;

  guard_id := auth.uid();

  select pa.*
  into r
  from pre_approvals pa
  where upper(pa.code) = upper(p_code)
  for update;

  if not found then
    return query select null::uuid, false, 'invalid_code';
    return;
  end if;

  select t.society_id
  into preapproval_society
  from flats f
  join towers t on t.id = f.tower_id
  where f.id = r.flat_id;

  if preapproval_society is distinct from (select my_society_id()) then
    return query select null::uuid, false, 'wrong_society';
    return;
  end if;

  if r.qr_used_at is not null and not r.recurring then
    return query select null::uuid, false, 'already_used';
    return;
  end if;

  if now() < r.start_at or now() > r.end_at then
    return query select null::uuid, false, 'out_of_window';
    return;
  end if;

  insert into visitors (
    society_id,
    flat_id,
    visitor_name,
    visitor_phone,
    type,
    purpose,
    status,
    pre_approved,
    pre_approval_id,
    guard_id
  )
  values (
    preapproval_society,
    r.flat_id,
    r.visitor_name,
    r.visitor_phone,
    r.type,
    'Pre-approved visit',
    'approved',
    true,
    r.id,
    guard_id
  )
  returning id into new_id;

  update pre_approvals
  set qr_used_at = now()
  where id = r.id
    and (qr_used_at is null or recurring);

  return query select new_id, true, ''::text;
end;
$$;

revoke all on function public.consume_preapproval(text) from public, anon;
grant execute on function public.consume_preapproval(text) to authenticated, service_role;
