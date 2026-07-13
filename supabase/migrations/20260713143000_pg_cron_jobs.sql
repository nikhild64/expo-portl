create extension if not exists pg_cron with schema extensions;

do $outer$
declare
  jid int;
begin
  select jobid into jid from cron.job where jobname = 'expire-pending-visitors';
  if jid is not null then
    perform cron.unschedule(jid);
  end if;

  select jobid into jid from cron.job where jobname = 'cancel-stale-bookings';
  if jid is not null then
    perform cron.unschedule(jid);
  end if;
end;
$outer$;

select cron.schedule(
  'expire-pending-visitors',
  '* * * * *',
  $$
    update visitors
    set status = 'expired'
    where status = 'pending'
      and requested_at < now() - interval '5 minutes'
  $$
);

select cron.schedule(
  'cancel-stale-bookings',
  '*/15 * * * *',
  $$
    update amenity_bookings
    set status = 'cancelled'
    where status = 'pending'
      and created_at < now() - interval '10 minutes'
      and payment_id is null
  $$
);
