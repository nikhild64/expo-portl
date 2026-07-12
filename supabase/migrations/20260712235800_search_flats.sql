create or replace function search_flats(p_society uuid, p_query text)
returns table(id uuid, number text, tower_name text, primary_resident text)
language sql
stable
as $$
  select
    f.id,
    f.number,
    t.name as tower_name,
    (
      select p.full_name
      from flat_residents fr
      join profiles p on p.id = fr.profile_id
      where fr.flat_id = f.id
      order by fr.is_head desc, fr.joined_at asc
      limit 1
    ) as primary_resident
  from flats f
  join towers t on t.id = f.tower_id
  where t.society_id = p_society
    and f.number ilike '%' || p_query || '%'
  order by t.name, f.number
  limit 20;
$$;

revoke all on function search_flats(uuid, text) from public, anon;
grant execute on function search_flats(uuid, text) to authenticated, service_role;
