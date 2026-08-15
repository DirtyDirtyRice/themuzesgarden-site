create or replace function public.make_project_tracks_private(p_project_id uuid)
returns integer language plpgsql security definer set search_path = public
as $$
declare changed_count integer;
begin
  if not exists (select 1 from public.projects where id = p_project_id and owner_id = auth.uid()) then
    raise exception 'Project not found or permission denied';
  end if;
  update public.project_tracks set visibility = 'private'
  where project_id = p_project_id and visibility <> 'private';
  get diagnostics changed_count = row_count;
  return changed_count;
end;
$$;
revoke all on function public.make_project_tracks_private(uuid) from public;
grant execute on function public.make_project_tracks_private(uuid) to authenticated;
