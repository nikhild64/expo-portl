-- Do not cancel amenity bookings that have an in-flight Razorpay payment (payments.status = created),
-- even when amenity_bookings.payment_id was not linked yet.

do $outer$
declare
  jid int;
begin
  select jobid into jid from cron.job where jobname = 'cancel-stale-bookings';
  if jid is not null then
    perform cron.unschedule(jid);
  end if;
end;
$outer$;

select cron.schedule(
  'cancel-stale-bookings',
  '*/15 * * * *',
  $$
    update amenity_bookings b
    set status = 'cancelled'
    where b.status = 'pending'
      and b.created_at < now() - interval '10 minutes'
      and b.payment_id is null
      and not exists (
        select 1
        from payments p
        where p.reference_id = b.id
          and p.purpose = 'amenity'
          and p.status = 'created'
      )
  $$
);
