create or replace function public.generate_monthly_dues_cycles()
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
    on conflict (flat_id, period) do nothing;
  end loop;
end;
$$;

revoke all on function public.generate_monthly_dues_cycles() from public;

do $outer$
declare
  jid int;
begin
  select jobid into jid from cron.job where jobname = 'monthly-dues';
  if jid is not null then
    perform cron.unschedule(jid);
  end if;
end;
$outer$;

select cron.schedule(
  'monthly-dues',
  '0 3 1 * *',
  $$select public.generate_monthly_dues_cycles()$$
);
