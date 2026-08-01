create table if not exists public.timeline_daw_recording_takes (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  session_id text not null,
  source_id text not null,
  name text not null,
  uri text not null,
  byte_length bigint not null check (byte_length > 0),
  checksum text not null,
  sample_rate integer not null check (sample_rate > 0),
  channel_count integer not null check (channel_count > 0),
  frame_count bigint not null check (frame_count > 0),
  duration_seconds double precision not null check (duration_seconds > 0),
  is_preferred boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, session_id, source_id)
);

create index if not exists timeline_daw_recording_takes_session_created_idx
on public.timeline_daw_recording_takes (owner_id, session_id, created_at desc);

create unique index if not exists timeline_daw_recording_takes_one_preferred_idx
on public.timeline_daw_recording_takes (owner_id, session_id)
where is_preferred;

alter table public.timeline_daw_recording_takes enable row level security;

create policy timeline_daw_recording_takes_owner_select
on public.timeline_daw_recording_takes for select to authenticated
using (owner_id = auth.uid());

create policy timeline_daw_recording_takes_owner_insert
on public.timeline_daw_recording_takes for insert to authenticated
with check (owner_id = auth.uid());

create policy timeline_daw_recording_takes_owner_update
on public.timeline_daw_recording_takes for update to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy timeline_daw_recording_takes_owner_delete
on public.timeline_daw_recording_takes for delete to authenticated
using (owner_id = auth.uid());
