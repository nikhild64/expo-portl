-- Bill only flats with at least one active resident (occupied), not every flat in inventory.

create or replace function society_occupied_flat_ids(p_society uuid)
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select distinct fr.flat_id
  from flat_residents fr
  join profiles p on p.id = fr.profile_id
  join flats f on f.id = fr.flat_id
  join towers t on t.id = f.tower_id
  where t.society_id = p_society
    and p.status = 'active';
$$;

revoke all on function society_occupied_flat_ids(uuid) from public, anon;
grant execute on function society_occupied_flat_ids(uuid) to authenticated, service_role;

create or replace function count_society_occupied_flats(p_society uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int from society_occupied_flat_ids(p_society);
$$;

revoke all on function count_society_occupied_flats(uuid) from public, anon;
grant execute on function count_society_occupied_flats(uuid) to authenticated, service_role;

create or replace function generate_dues_cycle(
  p_society uuid,
  p_period date,
  p_line_items jsonb,
  p_total numeric,
  p_due_date date
) returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted int;
begin
  if (select my_role()) <> 'admin' or (select my_society_id()) <> p_society then
    raise exception 'not_authorized';
  end if;

  if extract(day from p_period) <> 1 then
    raise exception 'period_must_be_first_day';
  end if;

  insert into dues (society_id, flat_id, period, line_items, total, due_date)
  select p_society, f.id, p_period, p_line_items, p_total, p_due_date
  from flats f
  join towers t on t.id = f.tower_id
  where t.society_id = p_society
    and f.id in (select society_occupied_flat_ids(p_society))
  on conflict (flat_id, period) do nothing;

  get diagnostics inserted = row_count;
  return inserted;
end;
$$;

revoke all on function generate_dues_cycle(uuid, date, jsonb, numeric, date) from public, anon;
grant execute on function generate_dues_cycle(uuid, date, jsonb, numeric, date) to authenticated;

create or replace function private.generate_monthly_dues_cycles()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  soc record;
  next_period date;
  due_date date;
  line_items jsonb;
  total numeric;
begin
  next_period := date_trunc('month', current_date + interval '1 month')::date;
  due_date := (next_period + interval '10 days')::date;

  for soc in select id from societies loop
    select d.line_items, d.total
    into line_items, total
    from dues d
    where d.society_id = soc.id
    order by d.period desc
    limit 1;

    if line_items is null then
      line_items := jsonb_build_array(jsonb_build_object('label', 'Maintenance', 'amount', 2500));
      total := 2500;
    end if;

    insert into dues (society_id, flat_id, period, line_items, total, due_date)
    select soc.id, f.id, next_period, line_items, total, due_date
    from flats f
    join towers t on t.id = f.tower_id
    where t.society_id = soc.id
      and f.id in (select society_occupied_flat_ids(soc.id))
    on conflict (flat_id, period) do nothing;
  end loop;
end;
$$;

revoke all on function private.generate_monthly_dues_cycles() from public, anon, authenticated;
grant execute on function private.generate_monthly_dues_cycles() to service_role;
