alter table public.timeline_daw_private_lane_edit_history
  drop constraint if exists timeline_daw_private_lane_edit_history_operation_check;
alter table public.timeline_daw_private_lane_edit_history
  add constraint timeline_daw_private_lane_edit_history_operation_check
  check (operation in ('arrange', 'split', 'duplicate', 'fade', 'remove', 'group'));

create policy timeline_daw_private_lane_edit_history_owner_delete on public.timeline_daw_private_lane_edit_history
for delete to authenticated using (owner_id = auth.uid());

create or replace function public.apply_timeline_daw_private_lane_group_edit(
  p_history_id text,
  p_session_id text,
  p_before_rows jsonb,
  p_after_rows jsonb
)
returns setof public.timeline_daw_private_audio_lanes
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_rows jsonb;
  target_ids text[];
begin
  if jsonb_typeof(p_before_rows) <> 'array' or jsonb_typeof(p_after_rows) <> 'array'
    or jsonb_array_length(p_before_rows) < 2 or jsonb_array_length(p_before_rows) <> jsonb_array_length(p_after_rows) then
    raise exception 'Group edit requires matching before and after snapshots for at least two regions.';
  end if;
  select array_agg(value->>'id' order by value->>'id') into target_ids from jsonb_array_elements(p_before_rows) value;
  if cardinality(target_ids) <> cardinality(array(select distinct unnest(target_ids))) then raise exception 'Group edit region IDs must be distinct.'; end if;
  if exists (select 1 from jsonb_array_elements(p_before_rows || p_after_rows) value
    where value->>'owner_id' <> auth.uid()::text or value->>'session_id' <> p_session_id
      or not ((value->>'id') = any(target_ids))) then
    raise exception 'Group edit snapshot ownership or region IDs are invalid.';
  end if;

  perform 1 from public.timeline_daw_private_audio_lanes
    where owner_id = auth.uid() and session_id = p_session_id and id = any(target_ids) for update;
  select coalesce(jsonb_agg(to_jsonb(lane) order by lane.id), '[]'::jsonb) into current_rows
    from public.timeline_daw_private_audio_lanes lane
    where owner_id = auth.uid() and session_id = p_session_id and id = any(target_ids);
  if current_rows <> p_before_rows then raise exception 'Private lane group edit conflict: lane state changed before the edit was applied.'; end if;

  delete from public.timeline_daw_private_audio_lanes where owner_id = auth.uid() and session_id = p_session_id and id = any(target_ids);
  insert into public.timeline_daw_private_audio_lanes
    select restored.* from jsonb_populate_recordset(null::public.timeline_daw_private_audio_lanes, p_after_rows) restored;
  delete from public.timeline_daw_private_lane_edit_history where owner_id = auth.uid() and session_id = p_session_id and state = 'undone';
  insert into public.timeline_daw_private_lane_edit_history
    (id, owner_id, session_id, operation, label, before_rows, after_rows)
    values (p_history_id, auth.uid(), p_session_id, 'group', 'Edit selected regions', p_before_rows, p_after_rows);

  return query select * from public.timeline_daw_private_audio_lanes
    where owner_id = auth.uid() and session_id = p_session_id order by timeline_start_seconds, id;
end;
$$;

revoke all on function public.apply_timeline_daw_private_lane_group_edit(text, text, jsonb, jsonb) from public;
grant execute on function public.apply_timeline_daw_private_lane_group_edit(text, text, jsonb, jsonb) to authenticated;
