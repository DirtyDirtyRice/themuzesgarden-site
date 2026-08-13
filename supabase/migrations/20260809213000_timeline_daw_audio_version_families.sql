create table if not exists public.timeline_daw_audio_families(
 id text primary key,owner_id uuid not null references auth.users(id) on delete cascade,session_id text not null,
 name text not null check(char_length(name) between 1 and 120),description text,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(owner_id,session_id,id)
);
create table if not exists public.timeline_daw_audio_family_versions(
 id text primary key,owner_id uuid not null references auth.users(id) on delete cascade,session_id text not null,
 family_id text not null references public.timeline_daw_audio_families(id) on delete cascade,
 source_id text not null,source_uri text not null,source_checksum text not null check(source_checksum~'^sha256:[a-f0-9]{64}$'),
 name text not null,source_role text not null check(source_role in('acapella','demo','stem','human-band','hybrid','finished')),
 version_label text not null,performer text,origin text,relationship text not null check(relationship in('source','alternate','stem','derived')),
 sample_rate integer not null check(sample_rate>0),channel_count integer not null check(channel_count>0),frame_count bigint not null check(frame_count>0),duration_seconds double precision not null check(duration_seconds>0),
 created_at timestamptz not null default now(),unique(owner_id,session_id,source_checksum)
);
alter table public.timeline_daw_audio_families enable row level security;alter table public.timeline_daw_audio_family_versions enable row level security;
create policy timeline_daw_audio_families_owner on public.timeline_daw_audio_families for all to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
create policy timeline_daw_audio_family_versions_owner on public.timeline_daw_audio_family_versions for all to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
create index if not exists timeline_daw_audio_families_session on public.timeline_daw_audio_families(owner_id,session_id,updated_at desc);
create index if not exists timeline_daw_audio_family_versions_family on public.timeline_daw_audio_family_versions(owner_id,session_id,family_id,created_at);