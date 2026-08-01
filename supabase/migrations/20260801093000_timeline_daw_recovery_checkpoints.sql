update storage.buckets
set allowed_mime_types = array['audio/wav', 'application/zip', 'application/json']
where id = 'timeline-daw-renders';
