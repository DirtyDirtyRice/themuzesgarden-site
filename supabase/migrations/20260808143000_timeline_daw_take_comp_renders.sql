alter table public.timeline_daw_take_comps
add column if not exists output_uri text,
add column if not exists output_checksum text,
add column if not exists output_byte_length bigint check (output_byte_length > 0),
add column if not exists output_sample_rate integer check (output_sample_rate > 0),
add column if not exists output_channel_count integer check (output_channel_count > 0),
add column if not exists output_frame_count bigint check (output_frame_count > 0),
add column if not exists output_duration_seconds double precision check (output_duration_seconds > 0),
add column if not exists rendered_at timestamptz;

alter table public.timeline_daw_take_comps
drop constraint if exists timeline_daw_take_comps_output_complete;

alter table public.timeline_daw_take_comps
add constraint timeline_daw_take_comps_output_complete check (
  (output_uri is null and output_checksum is null and output_byte_length is null
    and output_sample_rate is null and output_channel_count is null
    and output_frame_count is null and output_duration_seconds is null and rendered_at is null)
  or
  (output_uri is not null and output_checksum is not null and output_byte_length is not null
    and output_sample_rate is not null and output_channel_count is not null
    and output_frame_count is not null and output_duration_seconds is not null and rendered_at is not null)
);
