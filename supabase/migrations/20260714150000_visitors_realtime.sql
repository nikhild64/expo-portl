-- Enable Realtime on visitors so guard waiting/log screens refresh when residents decide.

alter table public.visitors replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.visitors;
exception
  when duplicate_object then null;
end $$;
