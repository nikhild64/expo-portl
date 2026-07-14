-- Notify residents when a new poll is published.

drop trigger if exists trg_push_polls on public.polls;
create trigger trg_push_polls
  after insert on public.polls
  for each row execute function public.tg_push_fanout();
