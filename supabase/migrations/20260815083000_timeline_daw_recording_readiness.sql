create table if not exists public.timeline_daw_recording_readiness_evidence (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  session_id text not null,
  device_id text not null,
  device_label text not null,
  peak_dbfs double precision not null check (peak_dbfs between -96 and 0),
  status text not null check (status in ('silent','low','ready','hot','clipping')),
  ready boolean not null,
  observed_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists timeline_daw_recording_readiness_lookup on public.timeline_daw_recording_readiness_evidence(owner_id,session_id,observed_at desc);
alter table public.timeline_daw_recording_readiness_evidence enable row level security;
create policy timeline_daw_recording_readiness_owner on public.timeline_daw_recording_readiness_evidence for all to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
