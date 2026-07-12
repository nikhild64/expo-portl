create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  society_id uuid references societies(id) on delete set null,
  full_name text not null,
  phone text,
  avatar_url text,
  role user_role not null default 'resident',
  status user_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_profiles_society on profiles(society_id);
create index idx_profiles_role_society on profiles(society_id, role);
create index idx_profiles_status on profiles(society_id, status);

create table flat_residents (
  flat_id uuid not null references flats(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  is_owner boolean not null default false,
  is_head boolean not null default false,
  joined_at timestamptz not null default now(),
  primary key (flat_id, profile_id)
);

create index idx_fr_profile on flat_residents(profile_id);
create index idx_fr_flat on flat_residents(flat_id);

create table family_members (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  relation text,
  age int
);

create index idx_family_members_profile on family_members(profile_id);

create table vehicles (
  id uuid primary key default gen_random_uuid(),
  flat_id uuid not null references flats(id) on delete cascade,
  type text not null,
  plate_number text not null,
  color text,
  model text,
  created_at timestamptz not null default now()
);

create index idx_vehicles_flat on vehicles(flat_id);
