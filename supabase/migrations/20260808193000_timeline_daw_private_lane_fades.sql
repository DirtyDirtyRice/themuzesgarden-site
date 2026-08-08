alter table public.timeline_daw_private_audio_lanes
  add column if not exists fade_in_seconds double precision not null default 0,
  add column if not exists fade_out_seconds double precision not null default 0;

alter table public.timeline_daw_private_audio_lanes
  drop constraint if exists timeline_daw_private_audio_lanes_fade_range_check;

alter table public.timeline_daw_private_audio_lanes
  add constraint timeline_daw_private_audio_lanes_fade_range_check check (
    fade_in_seconds >= 0
    and fade_out_seconds >= 0
    and fade_in_seconds + fade_out_seconds <= source_out_seconds - source_in_seconds
  );
