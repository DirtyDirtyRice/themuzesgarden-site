create table if not exists public.timeline_daw_private_clip_repairs (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  session_id text not null,
  lane_id text not null references public.timeline_daw_private_audio_lanes(id) on delete cascade,
  revision bigint not null default 0 check (revision >= 0),
  bypassed boolean not null default false,
  gain_points jsonb not null default '[]'::jsonb,
  spectral_repairs jsonb not null default '[]'::jsonb,
  state_checksum text not null check (state_checksum ~ '^sha256:[a-f0-9]{64}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, session_id, lane_id)
);

create table if not exists public.timeline_daw_private_clip_repair_history (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  session_id text not null,
  lane_id text not null,
  before_state jsonb not null,
  after_state jsonb not null,
  operation text not null check (operation in ('save', 'undo', 'redo')),
  state text not null default 'applied' check (state in ('applied', 'undone')),
  created_at timestamptz not null default now()
);

alter table public.timeline_daw_private_clip_repairs enable row level security;
alter table public.timeline_daw_private_clip_repair_history enable row level security;
create policy timeline_daw_private_clip_repairs_owner on public.timeline_daw_private_clip_repairs for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy timeline_daw_private_clip_repair_history_owner on public.timeline_daw_private_clip_repair_history for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create index if not exists timeline_daw_private_clip_repairs_session_lane on public.timeline_daw_private_clip_repairs(owner_id, session_id, lane_id);
create index if not exists timeline_daw_private_clip_repair_history_lane on public.timeline_daw_private_clip_repair_history(owner_id, session_id, lane_id, created_at desc);
