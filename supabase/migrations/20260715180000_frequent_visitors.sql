create table frequent_visitors (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  visitor_name text not null,
  visitor_phone text not null,
  visitor_type visitor_type not null default 'guest',
  created_at timestamptz not null default now(),
  unique (profile_id, visitor_phone)
);

create index idx_frequent_visitors_profile on frequent_visitors(profile_id);

alter table frequent_visitors enable row level security;
alter table frequent_visitors force row level security;

create policy "frequent_visitors_own_all"
on frequent_visitors for all
using (profile_id = auth.uid())
with check (profile_id = auth.uid());
