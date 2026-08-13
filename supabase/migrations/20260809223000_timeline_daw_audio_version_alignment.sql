create table if not exists public.timeline_daw_audio_version_alignments(
 id text primary key,owner_id uuid not null references auth.users(id) on delete cascade,session_id text not null,family_id text not null references public.timeline_daw_audio_families(id) on delete cascade,
 version_id text not null references public.timeline_daw_audio_family_versions(id) on delete cascade,source_checksum text not null,offset_seconds double precision not null,confidence double precision not null check(confidence between 0 and 1),
 method text not null check(method in('onset-correlation','manual')),confirmed boolean not null default false,revision bigint not null default 0,receipt_checksum text not null,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(owner_id,session_id,version_id)
);
create table if not exists public.timeline_daw_audio_version_alignment_history(
 id text primary key,owner_id uuid not null references auth.users(id) on delete cascade,session_id text not null,alignment_id text not null,before_state jsonb,after_state jsonb,state text not null default 'applied' check(state in('applied','undone')),created_at timestamptz not null default now()
);
create table if not exists public.timeline_daw_audio_version_markers(
 id text primary key,owner_id uuid not null references auth.users(id) on delete cascade,session_id text not null,family_id text not null references public.timeline_daw_audio_families(id) on delete cascade,version_id text not null references public.timeline_daw_audio_family_versions(id) on delete cascade,
 seconds double precision not null check(seconds>=0),label text not null,note text not null default '',decision text not null check(decision in('unreviewed','keeper','alternate','reject')),created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
alter table public.timeline_daw_audio_version_alignments enable row level security;alter table public.timeline_daw_audio_version_alignment_history enable row level security;alter table public.timeline_daw_audio_version_markers enable row level security;
create policy timeline_daw_audio_version_alignments_owner on public.timeline_daw_audio_version_alignments for all to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
create policy timeline_daw_audio_version_alignment_history_owner on public.timeline_daw_audio_version_alignment_history for all to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
create policy timeline_daw_audio_version_markers_owner on public.timeline_daw_audio_version_markers for all to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
create index if not exists timeline_daw_audio_version_markers_family on public.timeline_daw_audio_version_markers(owner_id,session_id,family_id,seconds);