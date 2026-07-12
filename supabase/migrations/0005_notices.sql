create table notices (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies(id) on delete cascade,
  category notice_category not null default 'general',
  title text not null,
  body text not null,
  pinned boolean not null default false,
  target_audience jsonb not null default '{"kind":"all"}'::jsonb,
  attachments jsonb not null default '[]'::jsonb,
  published_at timestamptz not null default now(),
  created_by uuid not null references profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index idx_notices_society_time on notices(society_id, pinned desc, published_at desc);

create table notice_reactions (
  notice_id uuid not null references notices(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  emoji text not null,
  primary key (notice_id, profile_id, emoji)
);

create index idx_notice_reactions_profile on notice_reactions(profile_id);

create table notice_reads (
  notice_id uuid not null references notices(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (notice_id, profile_id)
);

create index idx_notice_reads_profile on notice_reads(profile_id);
