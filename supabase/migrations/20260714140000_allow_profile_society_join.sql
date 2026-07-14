-- Allow pending users to set society_id once during onboarding.
-- protect_profile_fields previously locked society_id on every self-update,
-- so join-society step 2 silently failed for guards and residents.

create or replace function protect_profile_fields()
returns trigger
language plpgsql
as $$
begin
  if (select auth.uid()) is not null
     and (select my_role()) <> 'admin' then
    new.role := old.role;
    new.status := old.status;
    if old.society_id is not null then
      new.society_id := old.society_id;
    end if;
  end if;
  return new;
end;
$$;
