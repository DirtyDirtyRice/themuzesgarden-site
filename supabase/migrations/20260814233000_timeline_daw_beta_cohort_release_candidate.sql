create table if not exists public.timeline_daw_beta_candidate_receipts (
 id text primary key,
 owner_id uuid not null references auth.users(id) on delete cascade,
 session_id text not null,
 ready boolean not null,
 minimum_completed_testers integer not null check(minimum_completed_testers between 1 and 100),
 evaluation jsonb not null,
 evidence jsonb not null,
 receipt_checksum text not null check(receipt_checksum~'^sha256:[a-f0-9]{64}$'),
 observed_at timestamptz not null,
 created_at timestamptz not null default now()
);
create index if not exists timeline_daw_beta_candidate_receipts_session_idx on public.timeline_daw_beta_candidate_receipts(owner_id,session_id,observed_at desc);
alter table public.timeline_daw_beta_candidate_receipts enable row level security;
create policy timeline_daw_beta_candidate_receipts_owner on public.timeline_daw_beta_candidate_receipts for all to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
