insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'timeline-daw-renders',
  'timeline-daw-renders',
  false,
  1073741824,
  array['audio/wav']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy timeline_daw_render_owner_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'timeline-daw-renders'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy timeline_daw_render_owner_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'timeline-daw-renders'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy timeline_daw_render_owner_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'timeline-daw-renders'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'timeline-daw-renders'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy timeline_daw_render_owner_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'timeline-daw-renders'
  and (storage.foldername(name))[1] = auth.uid()::text
);
