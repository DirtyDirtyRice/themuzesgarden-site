create table if not exists public.timeline_daw_session_access_receipts (
 id text primary key, owner_id uuid not null references auth.users(id) on delete cascade,
 actor_id uuid not null references auth.users(id) on delete cascade, session_id text not null,
 enrollment_id text references public.timeline_daw_beta_enrollments(id) on delete set null,
 role text not null check(role in('owner','beta-collaborator')),
 capability text not null check(capability in('session:read','workflow:read','feedback:create','feedback:respond','transport:read')),
 action text not null, allowed boolean not null, reason text not null,
 receipt_checksum text not null check(receipt_checksum~'^sha256:[a-f0-9]{64}$'),
 observed_at timestamptz not null, created_at timestamptz not null default now()
);
create index if not exists timeline_daw_session_access_receipts_session_idx on public.timeline_daw_session_access_receipts(owner_id,session_id,observed_at desc);
alter table public.timeline_daw_session_access_receipts enable row level security;
create policy timeline_daw_session_access_receipt_participant_read on public.timeline_daw_session_access_receipts for select to authenticated using(owner_id=auth.uid() or actor_id=auth.uid());

create or replace function public.authorize_timeline_daw_beta_session(p_session_id text,p_capability text,p_action text,p_owner_id uuid default null) returns jsonb
language plpgsql security definer set search_path=public as $$
declare v_actor uuid:=auth.uid();v_owner uuid;v_enrollment public.timeline_daw_beta_enrollments;v_role text;v_allowed boolean:=false;v_reason text;v_id text:='timeline-daw-access-'||gen_random_uuid()::text;v_observed timestamptz:=clock_timestamp();v_observed_text text;v_checksum text;
begin
 if v_actor is null then raise exception 'Authentication is required';end if;
 if coalesce(trim(p_session_id),'')='' then raise exception 'sessionId is required';end if;
 if p_capability not in('session:read','workflow:read','feedback:create','feedback:respond','transport:read') then raise exception 'DAW session capability is invalid';end if;
 if length(coalesce(p_action,''))<2 or length(p_action)>120 then raise exception 'Access action is invalid';end if;
 if p_owner_id=v_actor then v_owner:=v_actor;v_role:='owner';v_allowed:=true;v_reason:='Verified session owner.';
 else
  select * into v_enrollment from public.timeline_daw_beta_enrollments where tester_id=v_actor and session_id=p_session_id order by created_at desc limit 1;
  if v_enrollment.id is null then raise exception 'No beta enrollment exists for this musician and session';end if;
  v_owner:=v_enrollment.owner_id;v_role:='beta-collaborator';
  if v_enrollment.state<>'active' then v_reason:='Enrollment is not active.';
  elsif v_enrollment.acknowledged_at is null then v_reason:='Beta acknowledgement is incomplete.';
  elsif v_enrollment.environment_checked_at is null or not(
   coalesce((v_enrollment.environment->>'secureContext')::boolean,false) and coalesce((v_enrollment.environment->>'supportedBrowser')::boolean,false) and
   coalesce((v_enrollment.environment->>'audioInput')::boolean,false) and coalesce((v_enrollment.environment->>'audioOutput')::boolean,false) and
   coalesce((v_enrollment.environment->>'localStorage')::boolean,false) and coalesce((v_enrollment.environment->>'fileApi')::boolean,false) and
   coalesce((v_enrollment.environment->>'supportedAudioTypes')::boolean,false)) then v_reason:='Environment readiness is incomplete.';
  elsif not exists(select 1 from public.timeline_daw_beta_release_receipts r where r.owner_id=v_owner and r.session_id=p_session_id and r.enrollment_id=v_enrollment.id and r.ready=true) then v_reason:='The owner release gate has not passed.';
  else v_allowed:=true;v_reason:='Released beta collaborator.';end if;
 end if;
 v_observed_text:=to_char(v_observed at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
 v_checksum:='sha256:'||encode(digest(v_id||'|'||v_actor::text||'|'||v_owner::text||'|'||p_session_id||'|'||coalesce(v_enrollment.id,'')||'|'||v_role||'|'||p_capability||'|'||case when v_allowed then 'true' else 'false' end||'|'||v_reason||'|'||v_observed_text,'sha256'),'hex');
 insert into public.timeline_daw_session_access_receipts(id,owner_id,actor_id,session_id,enrollment_id,role,capability,action,allowed,reason,receipt_checksum,observed_at) values(v_id,v_owner,v_actor,p_session_id,v_enrollment.id,v_role,p_capability,p_action,v_allowed,v_reason,v_checksum,v_observed);
 return jsonb_build_object('allowed',v_allowed,'actorId',v_actor,'ownerId',v_owner,'sessionId',p_session_id,'enrollmentId',v_enrollment.id,'role',v_role,'capability',p_capability,'reason',v_reason,'receiptId',v_id,'receiptChecksum',v_checksum,'observedAt',v_observed_text);
end$$;
revoke all on function public.authorize_timeline_daw_beta_session(text,text,text,uuid) from public,anon;
grant execute on function public.authorize_timeline_daw_beta_session(text,text,text,uuid) to authenticated;