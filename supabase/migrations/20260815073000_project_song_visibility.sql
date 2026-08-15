alter table public.project_tracks
  add column if not exists visibility text;

update public.project_tracks as pt
set visibility = case
  when exists (
    select 1
    from public.projects as p
    where p.id = pt.project_id
      and p.visibility = 'public'
  ) then 'public'
  else 'private'
end
where visibility is null;

alter table public.project_tracks
  alter column visibility set default 'private',
  alter column visibility set not null;

alter table public.project_tracks
  drop constraint if exists project_tracks_visibility_check;

alter table public.project_tracks
  add constraint project_tracks_visibility_check
  check (visibility in ('private', 'public'));

create index if not exists project_tracks_public_catalog_idx
  on public.project_tracks (project_id, visibility, track_id);

create or replace function public.set_project_track_visibility(
  p_project_id uuid,
  p_track_id text,
  p_visibility text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_visibility not in ('private', 'public') then
    raise exception 'Invalid project song visibility';
  end if;

  update public.project_tracks as pt
  set visibility = p_visibility
  from public.projects as p
  where pt.project_id = p.id
    and pt.project_id = p_project_id
    and pt.track_id::text = p_track_id
    and p.owner_id = auth.uid();

  if not found then
    raise exception 'Project song not found or permission denied';
  end if;
end;
$$;

revoke all on function public.set_project_track_visibility(uuid, text, text) from public;
grant execute on function public.set_project_track_visibility(uuid, text, text) to authenticated;
