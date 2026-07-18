-- Add email, flat association, and tracking to family_members
alter table family_members
  add column email text,
  add column flat_id uuid references flats(id) on delete cascade,
  add column consumed_at timestamptz;

create index idx_family_members_email on family_members(lower(email));

-- Allow sign-up users to read their own invite during join flow
-- Use auth.jwt() instead of querying auth.users (authenticated role cannot SELECT auth.users)
create policy "family_members_read_own_invite"
on family_members for select
to authenticated
using (lower(email) = lower(auth.jwt() ->> 'email'));
