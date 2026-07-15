-- Public bucket for amenity cover images (admin upload during create/edit).

insert into storage.buckets (id, name, public)
values ('amenity-covers', 'amenity-covers', true)
on conflict (id) do nothing;

create policy "amenity_covers_insert_admins"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'amenity-covers'
  and (select public.my_role()) = 'admin'
);

create policy "amenity_covers_update_admins"
on storage.objects for update
to authenticated
using (
  bucket_id = 'amenity-covers'
  and (select public.my_role()) = 'admin'
)
with check (
  bucket_id = 'amenity-covers'
  and (select public.my_role()) = 'admin'
);

create policy "amenity_covers_select_public"
on storage.objects for select
to authenticated
using (bucket_id = 'amenity-covers');
