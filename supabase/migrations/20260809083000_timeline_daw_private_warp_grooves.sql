create table if not exists public.timeline_daw_private_warp_maps (
  owner_id uuid not null references auth.users(id) on delete cascade,
  session_id text not null,
  lane_id text not null,
  markers jsonb not null default '[]'::jsonb,
  revision bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (owner_id, session_id, lane_id)
);

create table if not exists public.timeline_daw_private_grooves (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  grid_frames integer not null check (grid_frames > 0),
  offsets jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);


create table if not exists public.timeline_daw_private_warp_edits (
  id text primary key, owner_id uuid not null references auth.users(id) on delete cascade, session_id text not null, lane_id text not null,
  before_markers jsonb not null, after_markers jsonb not null, state text not null default 'applied' check (state in ('applied', 'undone')), created_at timestamptz not null default now()
);
alter table public.timeline_daw_private_warp_maps enable row level security;
alter table public.timeline_daw_private_grooves enable row level security;
alter table public.timeline_daw_private_warp_edits enable row level security;
drop policy if exists timeline_daw_private_warp_maps_owner on public.timeline_daw_private_warp_maps;
create policy timeline_daw_private_warp_maps_owner on public.timeline_daw_private_warp_maps using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists timeline_daw_private_grooves_owner on public.timeline_daw_private_grooves;
create policy timeline_daw_private_grooves_owner on public.timeline_daw_private_grooves using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists timeline_daw_private_warp_edits_owner on public.timeline_daw_private_warp_edits;
create policy timeline_daw_private_warp_edits_owner on public.timeline_daw_private_warp_edits using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
