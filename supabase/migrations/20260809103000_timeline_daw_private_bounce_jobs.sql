create table if not exists public.timeline_daw_private_bounce_jobs (
 id text primary key, owner_id uuid not null references auth.users(id) on delete cascade, session_id text not null,
 source_kind text not null check(source_kind in ('lane','bus')), source_id text not null,
 state text not null check(state in ('queued','running','completed','failed','cancelled')), progress double precision not null default 0 check(progress between 0 and 100),
 attempt integer not null default 1, recipe jsonb not null default '{}'::jsonb, latency_trim_samples integer not null default 0,
 artifact_id text, artifact_uri text, artifact_checksum text, error text, active boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.timeline_daw_private_bounce_activations (
 id text primary key, owner_id uuid not null references auth.users(id) on delete cascade, session_id text not null, job_id text not null,
 before_active boolean not null, after_active boolean not null, state text not null default 'applied' check(state in ('applied','undone')), created_at timestamptz not null default now()
);
alter table public.timeline_daw_private_bounce_jobs enable row level security;alter table public.timeline_daw_private_bounce_activations enable row level security;
drop policy if exists timeline_daw_private_bounce_jobs_owner on public.timeline_daw_private_bounce_jobs;create policy timeline_daw_private_bounce_jobs_owner on public.timeline_daw_private_bounce_jobs using(auth.uid()=owner_id) with check(auth.uid()=owner_id);
drop policy if exists timeline_daw_private_bounce_activations_owner on public.timeline_daw_private_bounce_activations;create policy timeline_daw_private_bounce_activations_owner on public.timeline_daw_private_bounce_activations using(auth.uid()=owner_id) with check(auth.uid()=owner_id);
