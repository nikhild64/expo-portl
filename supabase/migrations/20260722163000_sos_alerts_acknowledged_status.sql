-- Migration to allow 'acknowledged' status in public.sos_alerts table check constraint
do $$
declare
  r record;
begin
  for r in (
    select conname
    from pg_constraint
    where conrelid = 'public.sos_alerts'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%status%'
  ) loop
    execute format('alter table public.sos_alerts drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.sos_alerts add constraint sos_alerts_status_check check (status in ('active', 'acknowledged', 'resolved'));
