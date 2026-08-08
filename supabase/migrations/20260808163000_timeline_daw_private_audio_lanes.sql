create table if not exists public.timeline_daw_private_audio_lanes (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  session_id text not null,
  name text not null check (char_length(name) between 1 and 120),
  source_id text not null,
  source_uri text not null,
  source_checksum text not null,
  sample_rate integer not null check (sample_rate > 0),
  channel_count integer not null check (channel_count > 0),
  frame_count bigint not null check (frame_count > 0),
  duration_seconds double precision not null check (duration_seconds > 0),
  timeline_start_seconds double precision not null check (timeline_start_seconds between 0 and 86400),
  comp_id text,
  comp_render_checksum text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((comp_id is null and comp_render_checksum is null) or (comp_id is not null and comp_render_checksum is not null))
);

create index if not exists timeline_daw_private_audio_lanes_session_position_idx
on public.timeline_daw_private_audio_lanes (owner_id, session_id, timeline_start_seconds, created_at);

alter table public.timeline_daw_private_audio_lanes enable row level security;

create policy timeline_daw_private_audio_lanes_owner_select on public.timeline_daw_private_audio_lanes
for select to authenticated using (owner_id = auth.uid());
create policy timeline_daw_private_audio_lanes_owner_insert on public.timeline_daw_private_audio_lanes
for insert to authenticated with check (owner_id = auth.uid());
create policy timeline_daw_private_audio_lanes_owner_update on public.timeline_daw_private_audio_lanes
for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy timeline_daw_private_audio_lanes_owner_delete on public.timeline_daw_private_audio_lanes
for delete to authenticated using (owner_id = auth.uid());
