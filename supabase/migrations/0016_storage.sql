insert into storage.buckets (id, name, public)
values
  ('visitor-photos', 'visitor-photos', true),
  ('complaint-photos', 'complaint-photos', true),
  ('notice-attachments', 'notice-attachments', true),
  ('avatars', 'avatars', true),
  ('society-logos', 'society-logos', true)
on conflict (id) do nothing;

create policy "visitor_photos_insert_guards"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'visitor-photos'
  and (select public.my_role()) = 'guard'
);

create policy "complaint_photos_insert_authenticated"
on storage.objects for insert
to authenticated
with check (bucket_id = 'complaint-photos');

create policy "avatars_insert_own_folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "avatars_update_own_folder"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "notice_attachments_insert_admins"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'notice-attachments'
  and (select public.my_role()) = 'admin'
);

create policy "society_logos_insert_admins"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'society-logos'
  and (select public.my_role()) = 'admin'
);
