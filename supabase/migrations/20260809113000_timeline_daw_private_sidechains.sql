alter table public.timeline_daw_private_inserts add column if not exists sidechain jsonb;
alter table public.timeline_daw_private_inserts drop constraint if exists timeline_daw_private_inserts_effect_check;
alter table public.timeline_daw_private_inserts add constraint timeline_daw_private_inserts_effect_check check(effect in ('gain','filter','compressor','gate'));
create table if not exists public.timeline_daw_private_sidechain_edits (
 id text primary key, owner_id uuid not null references auth.users(id) on delete cascade, session_id text not null, insert_id text not null,
 before_state jsonb, after_state jsonb, state text not null default 'applied' check(state in ('applied','undone')), created_at timestamptz not null default now()
);
alter table public.timeline_daw_private_sidechain_edits enable row level security;
drop policy if exists timeline_daw_private_sidechain_edits_owner on public.timeline_daw_private_sidechain_edits;
create policy timeline_daw_private_sidechain_edits_owner on public.timeline_daw_private_sidechain_edits using(auth.uid()=owner_id) with check(auth.uid()=owner_id);
