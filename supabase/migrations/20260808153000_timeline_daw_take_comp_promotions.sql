alter table public.timeline_daw_take_comps
add column if not exists promoted_source_id text,
add column if not exists promoted_source_uri text,
add column if not exists promoted_render_checksum text,
add column if not exists promoted_at timestamptz;

alter table public.timeline_daw_take_comps
drop constraint if exists timeline_daw_take_comps_promotion_complete;

alter table public.timeline_daw_take_comps
add constraint timeline_daw_take_comps_promotion_complete check (
  (promoted_source_id is null and promoted_source_uri is null
    and promoted_render_checksum is null and promoted_at is null)
  or
  (promoted_source_id is not null and promoted_source_uri is not null
    and promoted_render_checksum is not null and promoted_at is not null)
);
