create table if not exists public.timeline_engine_activation_ledgers (
  id text primary key,
  schema_version integer not null check (schema_version = 1),
  saved_at timestamptz not null,
  archive jsonb not null,
  integrity jsonb not null,
  constraint timeline_engine_activation_integrity_algorithm
    check (integrity ->> 'algorithm' = 'sha256'),
  constraint timeline_engine_activation_integrity_hash
    check ((integrity ->> 'archiveHash') ~ '^[0-9a-f]{64}$'),
  constraint timeline_engine_activation_singleton check (id = 'primary')
);

alter table public.timeline_engine_activation_ledgers enable row level security;

revoke all on table public.timeline_engine_activation_ledgers from anon, authenticated;

comment on table public.timeline_engine_activation_ledgers is
  'Private server-only engine activation evidence. Access requires the service role.';
