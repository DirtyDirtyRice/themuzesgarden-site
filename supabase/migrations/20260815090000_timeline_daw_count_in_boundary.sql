alter table public.timeline_daw_recording_takes
  add column if not exists count_in_captured boolean not null default true;
