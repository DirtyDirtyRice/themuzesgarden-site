create table if not exists public.timeline_daw_beta_workflow_receipts (
  id text primary key, owner_id uuid not null references auth.users(id) on delete cascade, session_id text not null,
  stage text not null check(stage in('setup','capture','edit','mix','protect','export','complete')),
  completed integer not null check(completed between 0 and 6), required integer not null default 6 check(required=6),
  evidence jsonb not null, evaluation jsonb not null,
  receipt_checksum text not null check(receipt_checksum~'^sha256:[a-f0-9]{64}$'),
  observed_at timestamptz not null, created_at timestamptz not null default now(),
  unique(owner_id,session_id,receipt_checksum)
);
create index if not exists timeline_daw_beta_workflow_session_idx on public.timeline_daw_beta_workflow_receipts(owner_id,session_id,observed_at desc);
alter table public.timeline_daw_beta_workflow_receipts enable row level security;
create policy timeline_daw_beta_workflow_owner on public.timeline_daw_beta_workflow_receipts for all to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
