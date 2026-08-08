create table if not exists public.timeline_daw_private_waveforms (
  owner_id uuid not null references auth.users(id) on delete cascade,
  source_checksum text not null,
  sample_rate integer not null check (sample_rate > 0),
  channel_count integer not null check (channel_count > 0),
  frame_count bigint not null check (frame_count > 0),
  bin_count integer not null check (bin_count between 32 and 512),
  peaks jsonb not null check (jsonb_typeof(peaks) = 'array' and jsonb_array_length(peaks) = bin_count),
  created_at timestamptz not null default now(),
  primary key (owner_id, source_checksum, sample_rate, channel_count, frame_count)
);

alter table public.timeline_daw_private_waveforms enable row level security;

create policy timeline_daw_private_waveforms_owner_select on public.timeline_daw_private_waveforms
for select to authenticated using (owner_id = auth.uid());
create policy timeline_daw_private_waveforms_owner_insert on public.timeline_daw_private_waveforms
for insert to authenticated with check (owner_id = auth.uid());
create policy timeline_daw_private_waveforms_owner_update on public.timeline_daw_private_waveforms
for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
