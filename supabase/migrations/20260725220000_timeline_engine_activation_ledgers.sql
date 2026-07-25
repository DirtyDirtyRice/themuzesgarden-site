create table if not exists public.timeline_engine_activation_ledgers (
  id text primary key,
  schema_version integer not null check (schema_version = 1),
  saved_at timestamptz not null,
  archive jsonb not null,
  constraint timeline_engine_activation_singleton check (id = 'primary')
);

alter table public.timeline_engine_activation_ledgers enable row level security;

revoke all on table public.timeline_engine_activation_ledgers from anon, authenticated;

comment on table public.timeline_engine_activation_ledgers is
  'Private server-only engine activation evidence. Access requires the service role.';
