create table if not exists public.timeline_daw_song_experiments (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  session_id text not null,
  name text not null check (char_length(name) between 1 and 120),
  format text not null check (format in ('wav','mp3')),
  recipe jsonb not null,
  recipe_checksum text not null check (recipe_checksum ~ '^sha256:[a-f0-9]{64}$'),
  provenance jsonb not null,
  output_uri text,
  output_checksum text check (output_checksum is null or output_checksum ~ '^sha256:[a-f0-9]{64}$'),
  output_byte_length bigint check (output_byte_length is null or output_byte_length > 0),
  output_sample_rate integer check (output_sample_rate is null or output_sample_rate > 0),
  output_channel_count integer check (output_channel_count is null or output_channel_count > 0),
  output_frame_count bigint check (output_frame_count is null or output_frame_count > 0),
  output_duration_seconds double precision check (output_duration_seconds is null or output_duration_seconds > 0),
  rendered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.timeline_daw_song_experiments enable row level security;
create policy timeline_daw_song_experiments_owner on public.timeline_daw_song_experiments for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create index if not exists timeline_daw_song_experiments_session on public.timeline_daw_song_experiments (owner_id, session_id, updated_at desc);