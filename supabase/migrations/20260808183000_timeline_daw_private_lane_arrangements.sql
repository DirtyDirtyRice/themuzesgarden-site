alter table public.timeline_daw_private_audio_lanes
add column if not exists source_in_seconds double precision not null default 0,
add column if not exists source_out_seconds double precision;

update public.timeline_daw_private_audio_lanes
set source_out_seconds = duration_seconds
where source_out_seconds is null;

alter table public.timeline_daw_private_audio_lanes
alter column source_out_seconds set not null;

alter table public.timeline_daw_private_audio_lanes
drop constraint if exists timeline_daw_private_audio_lanes_source_range;

alter table public.timeline_daw_private_audio_lanes
add constraint timeline_daw_private_audio_lanes_source_range check (
  source_in_seconds >= 0
  and source_out_seconds > source_in_seconds
  and source_out_seconds <= duration_seconds
);
