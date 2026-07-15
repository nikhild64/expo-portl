-- push_fanout_config is internal-only (read by SECURITY DEFINER push triggers).
-- RLS is enabled with an explicit deny so clients cannot read fanout_url/fanout_key.
create policy "push_fanout_config_no_client_access"
on public.push_fanout_config for all
to authenticated, anon
using (false)
with check (false);
