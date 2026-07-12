create table complaints (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies(id) on delete cascade,
  flat_id uuid not null references flats(id) on delete cascade,
  raised_by uuid not null references profiles(id) on delete restrict,
  category text not null,
  title text not null,
  description text not null,
  priority complaint_priority not null default 'medium',
  status complaint_status not null default 'new',
  assigned_to uuid references profiles(id) on delete set null,
  photos jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index idx_complaints_society_status on complaints(society_id, status, priority);
create index idx_complaints_flat on complaints(flat_id, created_at desc);
create index idx_complaints_raised_by on complaints(raised_by, created_at desc);
create index idx_complaints_assigned_to on complaints(assigned_to, status) where assigned_to is not null;

create table complaint_updates (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references complaints(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete restrict,
  body text not null,
  kind complaint_update_kind not null default 'comment',
  created_at timestamptz not null default now()
);

create index idx_updates_complaint on complaint_updates(complaint_id, created_at);
create index idx_updates_profile on complaint_updates(profile_id, created_at desc);
