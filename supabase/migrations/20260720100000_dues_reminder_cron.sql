-- Automated 3-day dues reminder cron job.
-- Fires daily at 09:00 IST (03:30 UTC).
-- Sends a localized push notification to residents of flats whose dues
-- (status = 'due' or 'partial') have a due_date exactly 3 days from today.

create or replace function private.send_dues_reminders()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  rec record;
  resident record;
  reminder_date date;
  formatted_amount text;
  formatted_date_en text;
  formatted_date_hi text;
begin
  reminder_date := current_date + interval '3 days';

  for rec in
    select
      d.id        as due_id,
      d.flat_id,
      d.total,
      d.due_date
    from dues d
    where d.due_date = reminder_date
      and d.status in ('due', 'partial')
  loop
    -- Format amount as plain integer rupees (e.g. "2500")
    formatted_amount := floor(rec.total)::text;

    -- Format due date in English (e.g. "19 Jul")
    formatted_date_en := to_char(rec.due_date, 'DD Mon');

    -- Format due date in Hindi (e.g. "19 जुल॰")
    formatted_date_hi := to_char(rec.due_date, 'DD') || ' ' ||
      case extract(month from rec.due_date)::int
        when 1  then 'जन'
        when 2  then 'फ़र'
        when 3  then 'मार्च'
        when 4  then 'अप्रैल'
        when 5  then 'मई'
        when 6  then 'जून'
        when 7  then 'जुल॰'
        when 8  then 'अग'
        when 9  then 'सित'
        when 10 then 'अक्तू'
        when 11 then 'नव'
        when 12 then 'दिस'
      end;

    -- Notify every resident linked to this flat
    for resident in
      select fr.profile_id
      from flat_residents fr
      where fr.flat_id = rec.flat_id
    loop
      insert into notifications (profile_id, category, title, body, data)
      values (
        resident.profile_id,
        'payment-reminder',
        'Dues due in 3 days',
        'Your dues of ₹' || formatted_amount || ' are due on ' || formatted_date_en || '. Pay now to avoid overdue charges.',
        jsonb_build_object(
          'dueId',    rec.due_id,
          'template', 'duesUpcoming',
          'params',   jsonb_build_object(
            'amount',     formatted_amount,
            'dueDate',    formatted_date_en,
            'dueDateHi',  formatted_date_hi
          ),
          'url', '/(resident)/(payments)'
        )
      );
    end loop;
  end loop;
end;
$$;

revoke all on function private.send_dues_reminders() from public, anon, authenticated;
grant execute on function private.send_dues_reminders() to service_role;

-- Register (or replace) the daily 09:00 IST (03:30 UTC) cron job
do $outer$
declare
  jid int;
begin
  select jobid into jid from cron.job where jobname = 'dues-3day-reminder';
  if jid is not null then
    perform cron.unschedule(jid);
  end if;
end;
$outer$;

select cron.schedule(
  'dues-3day-reminder',
  '30 3 * * *',
  $$select private.send_dues_reminders()$$
);
