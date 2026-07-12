create table polls (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies(id) on delete cascade,
  category poll_category not null default 'general',
  question text not null,
  options jsonb not null,
  allow_multiple boolean not null default false,
  anonymous boolean not null default true,
  show_results boolean not null default true,
  quorum int not null default 0,
  target_audience jsonb not null default '{"kind":"all"}'::jsonb,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  created_by uuid not null references profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index idx_polls_society_ends on polls(society_id, ends_at);
create index idx_polls_society_created on polls(society_id, created_at desc);

create table poll_votes (
  poll_id uuid not null references polls(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  option_indices int[] not null,
  voted_at timestamptz not null default now(),
  primary key (poll_id, profile_id),
  check (array_length(option_indices, 1) > 0)
);

create index idx_poll_votes_profile on poll_votes(profile_id);

create table poll_comments (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references polls(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  body text not null,
  parent_id uuid references poll_comments(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index idx_poll_comments_poll on poll_comments(poll_id, created_at desc);
create index idx_poll_comments_profile on poll_comments(profile_id);
