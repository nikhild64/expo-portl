do $outer$
declare
  jid int;
begin
  select jobid into jid from cron.job where jobname = 'expire-stale-payments';
  if jid is not null then
    perform cron.unschedule(jid);
  end if;
end;
$outer$;

select cron.schedule(
  'expire-stale-payments',
  '*/15 * * * *',
  $$
    update payments
    set status = 'failed'
    where status = 'created'
      and created_at < now() - interval '30 minutes';

    update amenity_bookings b
    set status = 'failed'
    from payments p
    where p.reference_id = b.id
      and p.purpose = 'amenity'
      and p.status = 'failed'
      and b.status = 'pending'
      and p.created_at < now() - interval '30 minutes';
  $$
);
