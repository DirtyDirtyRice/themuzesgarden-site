create table if not exists public.timeline_daw_beta_feedback (
 id text primary key,owner_id uuid not null references auth.users(id) on delete cascade,session_id text not null,
 checkpoint_checksum text not null check(checkpoint_checksum~'^sha256:[a-f0-9]{64}$'),stage text not null check(stage in('setup','capture','edit','mix','protect','export')),
 severity text not null check(severity in('suggestion','minor','major','blocking')),reproducibility text not null check(reproducibility in('once','sometimes','always','not-tested')),
 summary text not null,expected_behavior text not null,reproduction_notes text not null,state text not null default 'open' check(state in('open','investigating','resolved','reopened')),
 feedback_checksum text not null check(feedback_checksum~'^sha256:[a-f0-9]{64}$'),created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table if not exists public.timeline_daw_beta_feedback_events (
 id text primary key,owner_id uuid not null references auth.users(id) on delete cascade,session_id text not null,feedback_id text not null references public.timeline_daw_beta_feedback(id) on delete cascade,
 actor_id uuid not null,event text not null check(event in('created','responded','state-changed')),before_state text,after_state text,response text,event_checksum text not null check(event_checksum~'^sha256:[a-f0-9]{64}$'),created_at timestamptz not null default now()
);
create index if not exists timeline_daw_beta_feedback_session_idx on public.timeline_daw_beta_feedback(owner_id,session_id,created_at desc);
alter table public.timeline_daw_beta_feedback enable row level security;alter table public.timeline_daw_beta_feedback_events enable row level security;
create policy timeline_daw_beta_feedback_owner on public.timeline_daw_beta_feedback for all to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
create policy timeline_daw_beta_feedback_events_owner on public.timeline_daw_beta_feedback_events for all to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
