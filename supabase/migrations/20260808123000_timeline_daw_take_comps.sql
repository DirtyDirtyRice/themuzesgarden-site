create table if not exists public.timeline_daw_take_comps (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  session_id text not null,
  name text not null check (char_length(name) between 1 and 120),
  regions jsonb not null check (
    jsonb_typeof(regions) = 'array'
    and jsonb_array_length(regions) between 2 and 100
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists timeline_daw_take_comps_session_updated_idx
on public.timeline_daw_take_comps (owner_id, session_id, updated_at desc);

alter table public.timeline_daw_take_comps enable row level security;

create policy timeline_daw_take_comps_owner_select
on public.timeline_daw_take_comps for select to authenticated
using (owner_id = auth.uid());

create policy timeline_daw_take_comps_owner_insert
on public.timeline_daw_take_comps for insert to authenticated
with check (owner_id = auth.uid());

create policy timeline_daw_take_comps_owner_update
on public.timeline_daw_take_comps for update to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy timeline_daw_take_comps_owner_delete
on public.timeline_daw_take_comps for delete to authenticated
using (owner_id = auth.uid());
