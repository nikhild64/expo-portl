-- Drop the broken policy
drop policy if exists "family_members_read_own_invite" on family_members;

-- Recreate it using auth.jwt() to avoid querying auth.users (which authenticated users cannot do)
create policy "family_members_read_own_invite"
on family_members for select
to authenticated
using (lower(email) = lower(auth.jwt() ->> 'email'));
