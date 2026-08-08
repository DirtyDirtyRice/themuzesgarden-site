create table if not exists public.timeline_daw_private_automation_envelopes (
  id text primary key, owner_id uuid not null references auth.users(id) on delete cascade, session_id text not null,
  source_kind text not null check (source_kind in ('lane','bus')), source_id text not null,
  parameter text not null check (parameter in ('gain','pan')), bypassed boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(owner_id, session_id, source_kind, source_id, parameter)
);
create table if not exists public.timeline_daw_private_automation_points (
  id text primary key, envelope_id text not null references public.timeline_daw_private_automation_envelopes(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade, sample_position bigint not null check (sample_position >= 0),
  value double precision not null, interpolation text not null check (interpolation in ('linear','hold')),
  created_at timestamptz not null default now(), unique(envelope_id, sample_position)
);
create table if not exists public.timeline_daw_private_automation_edits (
  id text primary key, owner_id uuid not null references auth.users(id) on delete cascade, session_id text not null,
  envelope_id text not null, before_state jsonb, after_state jsonb, state text not null default 'applied' check (state in ('applied','undone')),
  created_at timestamptz not null default now(), changed_at timestamptz not null default now()
);
alter table public.timeline_daw_private_automation_envelopes enable row level security;
alter table public.timeline_daw_private_automation_points enable row level security;
alter table public.timeline_daw_private_automation_edits enable row level security;
create policy timeline_daw_private_automation_envelopes_owner_all on public.timeline_daw_private_automation_envelopes for all to authenticated using (owner_id=auth.uid()) with check (owner_id=auth.uid());
create policy timeline_daw_private_automation_points_owner_all on public.timeline_daw_private_automation_points for all to authenticated using (owner_id=auth.uid()) with check (owner_id=auth.uid());
create policy timeline_daw_private_automation_edits_owner_all on public.timeline_daw_private_automation_edits for all to authenticated using (owner_id=auth.uid()) with check (owner_id=auth.uid());
