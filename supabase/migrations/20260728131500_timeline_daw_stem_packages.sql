update storage.buckets
set allowed_mime_types = array['audio/wav', 'application/zip']
where id = 'timeline-daw-renders';
