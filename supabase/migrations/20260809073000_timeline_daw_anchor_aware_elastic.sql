alter table public.timeline_daw_private_audio_lanes
  add column if not exists transform_quality text not null default 'balanced';

alter table public.timeline_daw_private_audio_lanes
  drop constraint if exists timeline_daw_private_audio_lanes_transform_quality_check;

alter table public.timeline_daw_private_audio_lanes
  add constraint timeline_daw_private_audio_lanes_transform_quality_check
  check (transform_quality in ('draft', 'balanced', 'high'));
