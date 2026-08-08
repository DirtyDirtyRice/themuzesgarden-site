create or replace function public.split_timeline_daw_private_audio_lane(
  p_lane_id text,
  p_session_id text,
  p_right_lane_id text,
  p_timeline_split_seconds double precision,
  p_source_split_seconds double precision
)
returns setof public.timeline_daw_private_audio_lanes
language plpgsql
security invoker
set search_path = public
as $$
declare
  stored public.timeline_daw_private_audio_lanes%rowtype;
  split_frame bigint;
  source_in_frame bigint;
  source_out_frame bigint;
begin
  select * into stored
  from public.timeline_daw_private_audio_lanes
  where id = p_lane_id and session_id = p_session_id and owner_id = auth.uid()
  for update;

  if not found then raise exception 'Private audio lane was not found.'; end if;
  source_in_frame := round(stored.source_in_seconds * stored.sample_rate);
  source_out_frame := round(stored.source_out_seconds * stored.sample_rate);
  split_frame := round(p_source_split_seconds * stored.sample_rate);
  if split_frame <= source_in_frame or split_frame >= source_out_frame then
    raise exception 'Lane split must leave at least one source frame on each side.';
  end if;
  if round(stored.fade_in_seconds * stored.sample_rate) > split_frame - source_in_frame
    or round(stored.fade_out_seconds * stored.sample_rate) > source_out_frame - split_frame then
    raise exception 'Lane split must be outside the existing edge fades.';
  end if;
  if abs((p_timeline_split_seconds - stored.timeline_start_seconds)
    - (p_source_split_seconds - stored.source_in_seconds)) > (0.5 / stored.sample_rate) then
    raise exception 'Lane split timeline and source positions are not sample-aligned.';
  end if;

  update public.timeline_daw_private_audio_lanes
  set source_out_seconds = split_frame::double precision / stored.sample_rate,
      fade_out_seconds = 0,
      updated_at = now()
  where id = stored.id;

  insert into public.timeline_daw_private_audio_lanes (
    id, owner_id, session_id, name, source_id, source_uri, source_checksum,
    sample_rate, channel_count, frame_count, duration_seconds, timeline_start_seconds,
    source_in_seconds, source_out_seconds, comp_id, comp_render_checksum,
    muted, soloed, gain, pan, fade_in_seconds, fade_out_seconds
  ) values (
    p_right_lane_id, stored.owner_id, stored.session_id, left(stored.name, 113) || ' Part 2',
    stored.source_id, stored.source_uri, stored.source_checksum,
    stored.sample_rate, stored.channel_count, stored.frame_count, stored.duration_seconds, p_timeline_split_seconds,
    split_frame::double precision / stored.sample_rate, stored.source_out_seconds,
    stored.comp_id, stored.comp_render_checksum,
    stored.muted, stored.soloed, stored.gain, stored.pan, 0, stored.fade_out_seconds
  );

  return query select * from public.timeline_daw_private_audio_lanes
    where id in (p_lane_id, p_right_lane_id)
    order by timeline_start_seconds, id;
end;
$$;

revoke all on function public.split_timeline_daw_private_audio_lane(text, text, text, double precision, double precision) from public;
grant execute on function public.split_timeline_daw_private_audio_lane(text, text, text, double precision, double precision) to authenticated;
