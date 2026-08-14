create table if not exists public.timeline_daw_technical_test_receipts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  session_id text not null,
  evidence jsonb not null,
  results jsonb not null,
  verified_count integer not null check (verified_count between 0 and 7),
  held_count integer not null check (held_count between 0 and 7),
  human_required_count integer not null check (human_required_count between 0 and 7),
  ready_for_human boolean not null,
  receipt_checksum text not null unique check (receipt_checksum ~ '^sha256:[a-f0-9]{64}$'),
  created_at timestamptz not null default now()
);

create index if not exists timeline_daw_technical_test_receipts_lookup
on public.timeline_daw_technical_test_receipts (owner_id, session_id, created_at desc);

alter table public.timeline_daw_technical_test_receipts enable row level security;

create policy "owners read their technical test receipts"
on public.timeline_daw_technical_test_receipts
for select to authenticated
using (owner_id = auth.uid());

create policy "owners add their technical test receipts"
on public.timeline_daw_technical_test_receipts
for insert to authenticated
with check (owner_id = auth.uid());
