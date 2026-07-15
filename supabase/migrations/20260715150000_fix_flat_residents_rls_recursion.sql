-- flat_residents_join_first_flat referenced flat_residents inside its own
-- INSERT policy (NOT EXISTS subquery), causing 42P17 infinite recursion on
-- every insert/upsert — including admin flat assignment.

drop policy if exists "flat_residents_join_first_flat" on flat_residents;

create policy "flat_residents_join_first_flat"
on flat_residents for insert
to authenticated
with check (
  profile_id = (select auth.uid())
  and (select my_society_id()) is null
  and not exists (select 1 from my_flat_ids())
);
