create table if not exists public.timeline_daw_owner_test_sessions (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
  session_id text not null, status text not null default 'active' check (status in ('active','completed','abandoned')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index if not exists timeline_daw_owner_test_one_active on public.timeline_daw_owner_test_sessions(owner_id,session_id) where status='active';
alter table public.timeline_daw_owner_test_sessions enable row level security;
create policy "owners manage their guided test sessions" on public.timeline_daw_owner_test_sessions for all using (auth.uid()=owner_id) with check (auth.uid()=owner_id);

create table if not exists public.timeline_daw_owner_test_observations (
  id uuid primary key default gen_random_uuid(), test_session_id uuid not null references public.timeline_daw_owner_test_sessions(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade, session_id text not null,
  step text not null check (step in ('protect','import','audition','edit','mix','recover','export')),
  outcome text not null check (outcome in ('pass','fail','confusing','blocked')), notes text not null default '',
  click_count integer check (click_count is null or click_count between 0 and 10000), excessive_steps boolean not null default false,
  screenshot_data_url text, failure_context jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create index if not exists timeline_daw_owner_test_observations_lookup on public.timeline_daw_owner_test_observations(owner_id,session_id,created_at);
alter table public.timeline_daw_owner_test_observations enable row level security;
create policy "owners read their guided test observations" on public.timeline_daw_owner_test_observations for select using (auth.uid()=owner_id);
create policy "owners add their guided test observations" on public.timeline_daw_owner_test_observations for insert with check (auth.uid()=owner_id);
