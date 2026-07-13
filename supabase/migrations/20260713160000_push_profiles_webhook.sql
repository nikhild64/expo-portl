-- Notify admins when a resident submits a join request (society_id set on pending profile).

drop trigger if exists trg_push_profiles on public.profiles;
create trigger trg_push_profiles
  after update on public.profiles
  for each row execute function public.tg_push_fanout();
