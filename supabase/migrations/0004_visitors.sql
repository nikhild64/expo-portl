create table pre_approvals (
  id uuid primary key default gen_random_uuid(),
  flat_id uuid not null references flats(id) on delete cascade,
  created_by_profile_id uuid not null references profiles(id) on delete cascade,
  visitor_name text not null,
  visitor_phone text,
  type visitor_type not null,
  vehicle_plate text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  code text not null unique,
  qr_used_at timestamptz,
  recurring boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  check (end_at > start_at)
);

create index idx_preapprovals_flat on pre_approvals(flat_id);
create index idx_preapprovals_code on pre_approvals(code);

create table visitors (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies(id) on delete cascade,
  flat_id uuid not null references flats(id) on delete cascade,
  visitor_name text not null,
  visitor_phone text,
  visitor_photo_url text,
  type visitor_type not null,
  purpose text,
  status visitor_status not null default 'pending',
  pre_approved boolean not null default false,
  pre_approval_id uuid references pre_approvals(id) on delete set null,
  guard_id uuid references profiles(id) on delete set null,
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references profiles(id) on delete set null,
  entered_at timestamptz,
  exited_at timestamptz,
  guard_note text,
  resident_instructions text
);

create index idx_visitors_society on visitors(society_id, requested_at desc);
create index idx_visitors_flat on visitors(flat_id, status);
create index idx_visitors_status on visitors(society_id, status) where status in ('pending', 'approved');
