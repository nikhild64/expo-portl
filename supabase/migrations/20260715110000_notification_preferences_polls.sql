-- Independent mute for poll push notifications (channel id: polls).

alter table public.notification_preferences
  add column if not exists polls boolean not null default true;
