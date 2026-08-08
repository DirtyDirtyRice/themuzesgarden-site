create table if not exists public.timeline_daw_private_lane_edit_history (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  session_id text not null,
  operation text not null check (operation in ('arrange', 'split', 'duplicate', 'fade', 'remove')),
  label text not null check (char_length(label) between 1 and 80),
  before_rows jsonb not null check (jsonb_typeof(before_rows) = 'array'),
  after_rows jsonb not null check (jsonb_typeof(after_rows) = 'array'),
  state text not null default 'applied' check (state in ('applied', 'undone')),
  created_at timestamptz not null default now(),
  changed_at timestamptz not null default now()
);

create index if not exists timeline_daw_private_lane_edit_history_order_idx
on public.timeline_daw_private_lane_edit_history (owner_id, session_id, created_at, id);

alter table public.timeline_daw_private_lane_edit_history enable row level security;
create policy timeline_daw_private_lane_edit_history_owner_select on public.timeline_daw_private_lane_edit_history
for select to authenticated using (owner_id = auth.uid());
create policy timeline_daw_private_lane_edit_history_owner_insert on public.timeline_daw_private_lane_edit_history
for insert to authenticated with check (owner_id = auth.uid());
create policy timeline_daw_private_lane_edit_history_owner_update on public.timeline_daw_private_lane_edit_history
for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create or replace function public.apply_timeline_daw_private_lane_history(
  p_history_id text,
  p_direction text
)
returns setof public.timeline_daw_private_audio_lanes
language plpgsql
security invoker
set search_path = public
as $$
declare
  receipt public.timeline_daw_private_lane_edit_history%rowtype;
  expected_rows jsonb;
  replacement_rows jsonb;
  current_rows jsonb;
  target_ids text[];
  ordered_id text;
begin
  if p_direction not in ('undo', 'redo') then raise exception 'History direction must be undo or redo.'; end if;
  select * into receipt from public.timeline_daw_private_lane_edit_history
    where id = p_history_id and owner_id = auth.uid() for update;
  if not found then raise exception 'Private lane edit receipt was not found.'; end if;

  if p_direction = 'undo' then
    if receipt.state <> 'applied' then raise exception 'Private lane edit is already undone.'; end if;
    select id into ordered_id from public.timeline_daw_private_lane_edit_history
      where owner_id = receipt.owner_id and session_id = receipt.session_id and state = 'applied'
      order by created_at desc, id desc limit 1;
    expected_rows := receipt.after_rows;
    replacement_rows := receipt.before_rows;
  else
    if receipt.state <> 'undone' then raise exception 'Private lane edit is not undone.'; end if;
    select id into ordered_id from public.timeline_daw_private_lane_edit_history
      where owner_id = receipt.owner_id and session_id = receipt.session_id and state = 'undone'
      order by created_at asc, id asc limit 1;
    expected_rows := receipt.before_rows;
    replacement_rows := receipt.after_rows;
  end if;
  if ordered_id <> receipt.id then raise exception 'Private lane history must be applied in order.'; end if;

  select array_agg(distinct value->>'id') into target_ids
  from jsonb_array_elements(receipt.before_rows || receipt.after_rows) value;
  select coalesce(jsonb_agg(to_jsonb(lane) order by lane.id), '[]'::jsonb) into current_rows
  from public.timeline_daw_private_audio_lanes lane where lane.id = any(target_ids)
    and lane.owner_id = receipt.owner_id and lane.session_id = receipt.session_id;
  if current_rows <> expected_rows then raise exception 'Private lane history conflict: lane state changed after this edit.'; end if;
  if exists (
    select 1 from jsonb_array_elements(replacement_rows) value
    where value->>'owner_id' <> receipt.owner_id::text or value->>'session_id' <> receipt.session_id
  ) then raise exception 'Private lane history snapshot ownership is invalid.'; end if;

  delete from public.timeline_daw_private_audio_lanes where id = any(target_ids)
    and owner_id = receipt.owner_id and session_id = receipt.session_id;
  insert into public.timeline_daw_private_audio_lanes
    select restored.* from jsonb_populate_recordset(null::public.timeline_daw_private_audio_lanes, replacement_rows) restored;
  update public.timeline_daw_private_lane_edit_history
    set state = case when p_direction = 'undo' then 'undone' else 'applied' end, changed_at = now()
    where id = receipt.id;
  return query select * from public.timeline_daw_private_audio_lanes
    where owner_id = receipt.owner_id and session_id = receipt.session_id order by timeline_start_seconds, id;
end;
$$;

revoke all on function public.apply_timeline_daw_private_lane_history(text, text) from public;
grant execute on function public.apply_timeline_daw_private_lane_history(text, text) to authenticated;
