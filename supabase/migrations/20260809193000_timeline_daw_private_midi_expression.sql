alter table public.timeline_daw_private_midi_clips add column if not exists pitch_bends jsonb not null default '[]'::jsonb,add column if not exists program_changes jsonb not null default '[]'::jsonb,add column if not exists artifact_recipe_checksum text;
alter table public.timeline_daw_private_midi_clips drop constraint if exists timeline_daw_private_midi_recipe_checksum;
alter table public.timeline_daw_private_midi_clips add constraint timeline_daw_private_midi_recipe_checksum check(artifact_recipe_checksum is null or artifact_recipe_checksum~'^sha256:[a-f0-9]{64}$');
