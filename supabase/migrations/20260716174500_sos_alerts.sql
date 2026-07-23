-- Migration to add SOS Alerts & Siren system tables and policies

create table public.sos_alerts (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  flat_id uuid references public.flats(id) on delete set null,
  created_by uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('active', 'acknowledged', 'resolved')) default 'active',
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_sos_alerts_society_status on public.sos_alerts(society_id, status, created_at desc);
create index idx_sos_alerts_created_by on public.sos_alerts(created_by, created_at desc);

-- RLS Enable
alter table public.sos_alerts enable row level security;

-- Policies
create policy "sos_alerts_read_society"
on public.sos_alerts for select
to authenticated
using (society_id = (select my_society_id()));

create policy "sos_alerts_insert_self"
on public.sos_alerts for insert
to authenticated
with check (
  society_id = (select my_society_id())
  and created_by = (select auth.uid())
  and status = 'active'
);

create policy "sos_alerts_update_society_guard_admin"
on public.sos_alerts for update
to authenticated
using (
  society_id = (select my_society_id())
)
with check (
  society_id = (select my_society_id())
  and (
    (select my_role()) in ('guard'::user_role, 'admin'::user_role)
    or (created_by = (select auth.uid()) and status = 'resolved')
  )
);

-- Enable Realtime
alter table public.sos_alerts replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.sos_alerts;
exception
  when duplicate_object then null;
end $$;
