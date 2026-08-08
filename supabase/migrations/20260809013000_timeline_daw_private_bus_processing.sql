create table if not exists public.timeline_daw_private_sends (
  id text primary key, owner_id uuid not null references auth.users(id) on delete cascade, session_id text not null,
  source_kind text not null check (source_kind in ('lane','bus')), source_id text not null,
  destination_bus_id text not null references public.timeline_daw_private_buses(id) on delete cascade,
  level double precision not null default 1 check (level between 0 and 2), pre_fader boolean not null default false,
  muted boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(owner_id, session_id, source_kind, source_id, destination_bus_id)
);
alter table public.timeline_daw_private_sends enable row level security;
create policy timeline_daw_private_sends_owner_select on public.timeline_daw_private_sends for select to authenticated using (owner_id=auth.uid());
create policy timeline_daw_private_sends_owner_insert on public.timeline_daw_private_sends for insert to authenticated with check (owner_id=auth.uid());
create policy timeline_daw_private_sends_owner_update on public.timeline_daw_private_sends for update to authenticated using (owner_id=auth.uid()) with check (owner_id=auth.uid());
create policy timeline_daw_private_sends_owner_delete on public.timeline_daw_private_sends for delete to authenticated using (owner_id=auth.uid());

create table if not exists public.timeline_daw_private_inserts (
  id text primary key, owner_id uuid not null references auth.users(id) on delete cascade, session_id text not null,
  source_kind text not null check (source_kind in ('lane','bus')), source_id text not null, slot integer not null check (slot between 0 and 2),
  effect text not null check (effect in ('gain','filter','compressor')), bypassed boolean not null default false,
  parameters jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(owner_id, session_id, source_kind, source_id, slot)
);
alter table public.timeline_daw_private_inserts enable row level security;
create policy timeline_daw_private_inserts_owner_select on public.timeline_daw_private_inserts for select to authenticated using (owner_id=auth.uid());
create policy timeline_daw_private_inserts_owner_insert on public.timeline_daw_private_inserts for insert to authenticated with check (owner_id=auth.uid());
create policy timeline_daw_private_inserts_owner_update on public.timeline_daw_private_inserts for update to authenticated using (owner_id=auth.uid()) with check (owner_id=auth.uid());
create policy timeline_daw_private_inserts_owner_delete on public.timeline_daw_private_inserts for delete to authenticated using (owner_id=auth.uid());
