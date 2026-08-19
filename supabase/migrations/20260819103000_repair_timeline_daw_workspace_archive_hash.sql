create or replace function public.repair_timeline_daw_workspace_archive_hash(
  p_owner_id uuid,
  p_revision bigint,
  p_archive_hash text
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
  if p_archive_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'DAW workspace archive hash is invalid';
  end if;

  update public.timeline_daw_workspace_archives
  set archive_hash = p_archive_hash
  where owner_id = p_owner_id and revision = p_revision;

  get diagnostics affected = row_count;
  return affected = 1;
end;
$$;

revoke all on function public.repair_timeline_daw_workspace_archive_hash(
  uuid, bigint, text
) from public, anon;

grant execute on function public.repair_timeline_daw_workspace_archive_hash(
  uuid, bigint, text
) to authenticated;
