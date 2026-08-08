alter table public.timeline_daw_private_audio_lanes
add column if not exists muted boolean not null default false,
add column if not exists soloed boolean not null default false,
add column if not exists gain double precision not null default 1 check (gain between 0 and 2),
add column if not exists pan double precision not null default 0 check (pan between -1 and 1);
