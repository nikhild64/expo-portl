create table societies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  address text,
  city text,
  logo_url text,
  created_at timestamptz not null default now()
);

create table towers (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (society_id, name)
);

create table flats (
  id uuid primary key default gen_random_uuid(),
  tower_id uuid not null references towers(id) on delete cascade,
  number text not null,
  floor int,
  bhk int,
  created_at timestamptz not null default now(),
  unique (tower_id, number)
);

create index idx_towers_society on towers(society_id);
create index idx_flats_tower on flats(tower_id);
