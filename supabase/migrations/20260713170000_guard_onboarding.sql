-- Allow self-signup as guard (pending until society admin approves).
drop policy if exists "profiles_insert_self" on profiles;

create policy "profiles_insert_self"
on profiles for insert
to authenticated
with check (
  id = (select auth.uid())
  and role in ('resident', 'guard')
  and status = 'pending'
);
