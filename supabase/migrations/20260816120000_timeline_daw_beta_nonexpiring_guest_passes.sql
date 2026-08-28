alter table public.timeline_daw_beta_invitations alter column expires_at drop not null;

create or replace function public.redeem_timeline_daw_beta_invitation(p_code_hash text) returns text
language plpgsql security definer set search_path=public as $$
declare v_inv public.timeline_daw_beta_invitations; v_id text;
begin
  if auth.uid() is null then raise exception 'Authentication is required'; end if;
  select * into v_inv from public.timeline_daw_beta_invitations
    where invite_code_hash=p_code_hash and state='active' and (expires_at is null or expires_at>now()) for update;
  if v_inv.id is null then raise exception 'Guest pass is invalid, already used, or revoked'; end if;
  v_id='timeline-daw-beta-enrollment-'||gen_random_uuid()::text;
  insert into public.timeline_daw_beta_enrollments(id,invitation_id,owner_id,project_id,session_id,tester_id)
    values(v_id,v_inv.id,v_inv.owner_id,v_inv.project_id,v_inv.session_id,auth.uid())
    on conflict(invitation_id,tester_id) do update set state='active',updated_at=now() returning id into v_id;
  update public.timeline_daw_beta_invitations set state='redeemed',updated_at=now() where id=v_inv.id;
  return v_id;
end$$;

revoke all on function public.redeem_timeline_daw_beta_invitation(text) from public,anon;
grant execute on function public.redeem_timeline_daw_beta_invitation(text) to authenticated;
