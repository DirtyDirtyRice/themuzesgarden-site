create table if not exists public.timeline_daw_workspace_archives (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  revision bigint not null check (revision >= 1),
  archive jsonb not null,
  archive_hash text not null check (archive_hash ~ '^[0-9a-f]{64}$'),
  updated_at timestamptz not null
);

alter table public.timeline_daw_workspace_archives enable row level security;

revoke all on table public.timeline_daw_workspace_archives from anon, authenticated;

grant select on table public.timeline_daw_workspace_archives to authenticated;

create policy timeline_daw_workspace_owner_read
on public.timeline_daw_workspace_archives
for select
to authenticated
using (owner_id = auth.uid());

comment on table public.timeline_daw_workspace_archives is
  'Private, owner-scoped DAW session archives protected by authenticated owner identity.';

create or replace function public.save_timeline_daw_workspace_archive(
  p_owner_id uuid,
  p_expected_revision bigint,
  p_next_revision bigint,
  p_archive jsonb,
  p_archive_hash text,
  p_updated_at timestamptz
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
begin
  if auth.uid() is null or auth.uid() <> p_owner_id then
    raise exception 'DAW workspace owner authentication failed';
  end if;
  if p_next_revision <> p_expected_revision + 1 then
    raise exception 'DAW workspace revision must advance exactly once';
  end if;
  if p_archive_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'DAW workspace archive hash is invalid';
  end if;

  if p_expected_revision = 0 then
    insert into public.timeline_daw_workspace_archives (
      owner_id, revision, archive, archive_hash, updated_at
    ) values (
      p_owner_id, p_next_revision, p_archive, p_archive_hash, p_updated_at
    ) on conflict (owner_id) do nothing;
  else
    update public.timeline_daw_workspace_archives
    set revision = p_next_revision,
        archive = p_archive,
        archive_hash = p_archive_hash,
        updated_at = p_updated_at
    where owner_id = p_owner_id and revision = p_expected_revision;
  end if;

  get diagnostics affected = row_count;
  return affected = 1;
end;
$$;

revoke all on function public.save_timeline_daw_workspace_archive(
  uuid, bigint, bigint, jsonb, text, timestamptz
) from public, anon;

grant execute on function public.save_timeline_daw_workspace_archive(
  uuid, bigint, bigint, jsonb, text, timestamptz
) to authenticated;
