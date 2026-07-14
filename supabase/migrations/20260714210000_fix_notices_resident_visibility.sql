-- Residents could not read notices when target_audience used unsupported { roles: [...] }
-- without kind. Normalize existing rows and tighten RLS (hide unpublished drafts from residents).

update public.notices
set target_audience = '{"kind":"all"}'::jsonb
where coalesce(target_audience->>'kind', '') not in ('all', 'towers', 'flats')
   or (target_audience ? 'roles' and coalesce(target_audience->>'kind', '') <> 'roles');

drop policy if exists "notices_read_society_audience" on public.notices;

create policy "notices_read_society_audience"
on public.notices for select
to authenticated
using (
  society_id = (select my_society_id())
  and published_at is not null
  and (
    (select my_role()) in ('admin', 'guard')
    or (
      published_at <= now()
      and (
        target_audience->>'kind' = 'all'
        or (
          target_audience->>'kind' = 'towers'
          and exists (
            select 1
            from flat_residents fr
            join flats f on f.id = fr.flat_id
            where fr.profile_id = (select auth.uid())
              and f.tower_id::text in (select jsonb_array_elements_text(target_audience->'ids'))
          )
        )
        or (
          target_audience->>'kind' = 'flats'
          and exists (
            select 1
            from flat_residents fr
            where fr.profile_id = (select auth.uid())
              and fr.flat_id::text in (select jsonb_array_elements_text(target_audience->'ids'))
          )
        )
        or (
          target_audience->>'kind' = 'roles'
          and (select my_role())::text in (
            select jsonb_array_elements_text(target_audience->'roles')
          )
        )
      )
    )
  )
);
