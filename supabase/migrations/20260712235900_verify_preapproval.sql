create or replace function verify_preapproval(p_code text)
returns table(
  pre_approval_id uuid,
  flat_id uuid,
  visitor_name text,
  visitor_phone text,
  type visitor_type,
  valid boolean,
  reason text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  r pre_approvals%rowtype;
  preapproval_society uuid;
begin
  if (select my_role()) not in ('guard', 'admin') then
    return query select null::uuid, null::uuid, null::text, null::text, null::visitor_type, false, 'not_authorized';
    return;
  end if;

  select pa.*
  into r
  from pre_approvals pa
  where upper(pa.code) = upper(p_code);

  if not found then
    return query select null::uuid, null::uuid, null::text, null::text, null::visitor_type, false, 'invalid_code';
    return;
  end if;

  select t.society_id
  into preapproval_society
  from flats f
  join towers t on t.id = f.tower_id
  where f.id = r.flat_id;

  if preapproval_society is distinct from (select my_society_id()) then
    return query select r.id, r.flat_id, r.visitor_name, r.visitor_phone, r.type, false, 'wrong_society';
    return;
  end if;

  if r.qr_used_at is not null and not r.recurring then
    return query select r.id, r.flat_id, r.visitor_name, r.visitor_phone, r.type, false, 'already_used';
    return;
  end if;

  if now() < r.start_at or now() > r.end_at then
    return query select r.id, r.flat_id, r.visitor_name, r.visitor_phone, r.type, false, 'out_of_window';
    return;
  end if;

  return query select r.id, r.flat_id, r.visitor_name, r.visitor_phone, r.type, true, ''::text;
end;
$$;

revoke all on function verify_preapproval(text) from public, anon;
grant execute on function verify_preapproval(text) to authenticated, service_role;

create policy "pre_approvals_update_guard_qr_used"
on pre_approvals for update
to authenticated
using (
  (select my_role()) = 'guard'
  and exists (
    select 1
    from flats f
    join towers t on t.id = f.tower_id
    where f.id = pre_approvals.flat_id
      and t.society_id = (select my_society_id())
  )
)
with check (
  (select my_role()) = 'guard'
  and exists (
    select 1
    from flats f
    join towers t on t.id = f.tower_id
    where f.id = pre_approvals.flat_id
      and t.society_id = (select my_society_id())
  )
);
