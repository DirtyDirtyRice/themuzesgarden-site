create table if not exists public.timeline_daw_private_buses (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  session_id text not null,
  name text not null check (char_length(name) between 1 and 80),
  muted boolean not null default false,
  soloed boolean not null default false,
  gain double precision not null default 1 check (gain between 0 and 2),
  pan double precision not null default 0 check (pan between -1 and 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, session_id, name)
);

alter table public.timeline_daw_private_buses enable row level security;
create policy timeline_daw_private_buses_owner_select on public.timeline_daw_private_buses for select to authenticated using (owner_id = auth.uid());
create policy timeline_daw_private_buses_owner_insert on public.timeline_daw_private_buses for insert to authenticated with check (owner_id = auth.uid());
create policy timeline_daw_private_buses_owner_update on public.timeline_daw_private_buses for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy timeline_daw_private_buses_owner_delete on public.timeline_daw_private_buses for delete to authenticated using (owner_id = auth.uid());

alter table public.timeline_daw_private_audio_lanes add column if not exists bus_id text references public.timeline_daw_private_buses(id) on delete set null;
create index if not exists timeline_daw_private_audio_lanes_bus_idx on public.timeline_daw_private_audio_lanes(owner_id, session_id, bus_id);
