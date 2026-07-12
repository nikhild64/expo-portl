create table push_tokens (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  expo_token text not null unique,
  device_id text,
  platform text not null default 'android',
  last_seen_at timestamptz not null default now(),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_push_tokens_profile on push_tokens(profile_id) where active;

create table notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  category text not null,
  title text not null,
  body text,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_notifications_profile_unread on notifications(profile_id, created_at desc) where read_at is null;
create index idx_notifications_profile on notifications(profile_id, created_at desc);

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies(id) on delete cascade,
  actor_profile_id uuid references profiles(id) on delete set null,
  entity text not null,
  entity_id uuid,
  action text not null,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);

create index idx_audit_society_time on audit_log(society_id, created_at desc);
create index idx_audit_actor_time on audit_log(actor_profile_id, created_at desc) where actor_profile_id is not null;
