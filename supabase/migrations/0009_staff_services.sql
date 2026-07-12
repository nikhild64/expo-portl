create table staff (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies(id) on delete cascade,
  name text not null,
  role text not null,
  phone text,
  photo_url text,
  shift_start time,
  shift_end time,
  verified boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_staff_society on staff(society_id, role);
create index idx_staff_active on staff(society_id, active) where active;

create table service_providers (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies(id) on delete cascade,
  name text not null,
  category text not null,
  phone text,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_services_society on service_providers(society_id, category);
