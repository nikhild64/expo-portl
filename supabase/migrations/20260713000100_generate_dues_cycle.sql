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
  on conflict (flat_id, period) do nothing;

  get diagnostics inserted = row_count;
  return inserted;
end;
$$;

revoke all on function generate_dues_cycle(uuid, date, jsonb, numeric, date) from public;
grant execute on function generate_dues_cycle(uuid, date, jsonb, numeric, date) to authenticated;
