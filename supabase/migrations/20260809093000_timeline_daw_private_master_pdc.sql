alter table public.timeline_daw_private_inserts add column if not exists latency_samples integer not null default 0 check (latency_samples between 0 and 192000);

create table if not exists public.timeline_daw_private_masters (
 owner_id uuid not null references auth.users(id) on delete cascade, session_id text not null,
 gain double precision not null default 1 check (gain between 0 and 2), muted boolean not null default false,
 revision bigint not null default 0, updated_at timestamptz not null default now(), primary key(owner_id,session_id)
);
create table if not exists public.timeline_daw_private_master_edits (
 id text primary key, owner_id uuid not null references auth.users(id) on delete cascade, session_id text not null,
 before_state jsonb not null, after_state jsonb not null, state text not null default 'applied' check(state in ('applied','undone')),
 created_at timestamptz not null default now()
);
alter table public.timeline_daw_private_masters enable row level security;
alter table public.timeline_daw_private_master_edits enable row level security;
drop policy if exists timeline_daw_private_masters_owner on public.timeline_daw_private_masters;
create policy timeline_daw_private_masters_owner on public.timeline_daw_private_masters using(auth.uid()=owner_id) with check(auth.uid()=owner_id);
drop policy if exists timeline_daw_private_master_edits_owner on public.timeline_daw_private_master_edits;
create policy timeline_daw_private_master_edits_owner on public.timeline_daw_private_master_edits using(auth.uid()=owner_id) with check(auth.uid()=owner_id);
