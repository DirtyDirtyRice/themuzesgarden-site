create table if not exists public.timeline_daw_private_freezes (
  id text primary key, owner_id uuid not null references auth.users(id) on delete cascade, session_id text not null,
  source_kind text not null check (source_kind in ('lane','bus')), source_id text not null,
  recipe jsonb not null, recipe_checksum text not null check (recipe_checksum ~ '^sha256:[a-f0-9]{64}$'),
  artifact_id text not null, artifact_uri text not null, artifact_checksum text not null check (artifact_checksum ~ '^sha256:[a-f0-9]{64}$'),
  byte_length bigint not null check (byte_length > 44), sample_rate integer not null, channel_count integer not null, frame_count bigint not null,
  active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(owner_id, session_id, source_kind, source_id)
);
alter table public.timeline_daw_private_freezes enable row level security;
create policy timeline_daw_private_freezes_owner_select on public.timeline_daw_private_freezes for select to authenticated using (owner_id=auth.uid());
create policy timeline_daw_private_freezes_owner_insert on public.timeline_daw_private_freezes for insert to authenticated with check (owner_id=auth.uid());
create policy timeline_daw_private_freezes_owner_update on public.timeline_daw_private_freezes for update to authenticated using (owner_id=auth.uid()) with check (owner_id=auth.uid());
create policy timeline_daw_private_freezes_owner_delete on public.timeline_daw_private_freezes for delete to authenticated using (owner_id=auth.uid());
