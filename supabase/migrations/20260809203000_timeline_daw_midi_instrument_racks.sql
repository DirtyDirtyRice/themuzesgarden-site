create table if not exists public.timeline_daw_midi_rack_presets (
  id text primary key, owner_id uuid not null references auth.users(id) on delete cascade, session_id text not null,
  name text not null check(char_length(name) between 1 and 120), version bigint not null default 1 check(version > 0),
  layers jsonb not null, checksum text not null check(checksum ~ '^sha256:[a-f0-9]{64}$'),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(owner_id,session_id,id)
);
create table if not exists public.timeline_daw_midi_controller_templates (
  id text primary key, owner_id uuid not null references auth.users(id) on delete cascade, session_id text not null,
  name text not null check(char_length(name) between 1 and 120), controller integer not null check(controller between 0 and 127),
  channel integer not null check(channel between 1 and 16), default_value integer not null check(default_value between 0 and 127),
  created_at timestamptz not null default now(), unique(owner_id,session_id,id)
);
alter table public.timeline_daw_private_midi_clips
  add column if not exists rack_preset_id text,
  add column if not exists rack_preset_version bigint,
  add column if not exists midi_automation jsonb not null default '[]'::jsonb,
  add column if not exists program_map jsonb not null default '[]'::jsonb,
  add column if not exists frozen boolean not null default false,
  add column if not exists frozen_recipe_checksum text;
alter table public.timeline_daw_private_midi_clips drop constraint if exists timeline_daw_midi_frozen_recipe_checksum;
alter table public.timeline_daw_private_midi_clips add constraint timeline_daw_midi_frozen_recipe_checksum check(frozen_recipe_checksum is null or frozen_recipe_checksum ~ '^sha256:[a-f0-9]{64}$');
alter table public.timeline_daw_midi_rack_presets enable row level security;
alter table public.timeline_daw_midi_controller_templates enable row level security;
create policy timeline_daw_midi_rack_presets_owner on public.timeline_daw_midi_rack_presets for all to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
create policy timeline_daw_midi_controller_templates_owner on public.timeline_daw_midi_controller_templates for all to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
create index if not exists timeline_daw_midi_rack_presets_session on public.timeline_daw_midi_rack_presets(owner_id,session_id,updated_at desc);
create index if not exists timeline_daw_midi_controller_templates_session on public.timeline_daw_midi_controller_templates(owner_id,session_id,name);