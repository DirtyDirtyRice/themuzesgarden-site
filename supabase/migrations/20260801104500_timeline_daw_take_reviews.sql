alter table public.timeline_daw_recording_takes
add column if not exists notes text not null default '',
add column if not exists rating smallint not null default 0
  check (rating between 0 and 5);

alter table public.timeline_daw_recording_takes
drop constraint if exists timeline_daw_recording_takes_notes_length;

alter table public.timeline_daw_recording_takes
add constraint timeline_daw_recording_takes_notes_length
check (char_length(notes) <= 1000);
