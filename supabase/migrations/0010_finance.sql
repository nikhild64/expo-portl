create table dues (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies(id) on delete cascade,
  flat_id uuid not null references flats(id) on delete cascade,
  period date not null,
  line_items jsonb not null,
  total numeric(10, 2) not null,
  due_date date not null,
  status dues_status not null default 'due',
  paid_at timestamptz,
  payment_id uuid,
  created_at timestamptz not null default now(),
  unique (flat_id, period),
  check (extract(day from period) = 1),
  check (total >= 0)
);

create index idx_dues_flat_period on dues(flat_id, period desc);
create index idx_dues_status on dues(society_id, status);

create table payments (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete restrict,
  order_id text not null unique,
  razorpay_payment_id text unique,
  razorpay_signature text,
  amount numeric(10, 2) not null,
  currency text not null default 'INR',
  purpose payment_purpose not null,
  reference_id uuid,
  status payment_status not null default 'created',
  raw_webhook jsonb,
  created_at timestamptz not null default now(),
  captured_at timestamptz,
  check (amount >= 0)
);

create index idx_payments_profile on payments(profile_id, created_at desc);
create index idx_payments_reference on payments(reference_id);
create index idx_payments_society_status on payments(society_id, status);

alter table dues
  add constraint dues_payment_id_fkey
  foreign key (payment_id) references payments(id) on delete set null;

alter table amenity_bookings
  add constraint amenity_bookings_payment_id_fkey
  foreign key (payment_id) references payments(id) on delete set null;
