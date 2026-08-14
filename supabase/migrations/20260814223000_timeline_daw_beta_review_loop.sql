create or replace function public.get_timeline_daw_beta_collaboration(p_session_id text) returns jsonb
language plpgsql security definer set search_path=public as $$
declare v_access jsonb;v_owner uuid;v_actor uuid:=auth.uid();v_role text;v_workflow jsonb;v_feedback jsonb;v_events jsonb;
begin
 v_access:=public.authorize_timeline_daw_beta_session(p_session_id,'workflow:read','read-beta-review-loop',null);
 if not coalesce((v_access->>'allowed')::boolean,false) then raise exception '%',v_access->>'reason';end if;
 v_owner:=(v_access->>'ownerId')::uuid;v_role:=v_access->>'role';
 select to_jsonb(row) into v_workflow from(select id,stage,completed,required,evidence,evaluation,receipt_checksum,observed_at from public.timeline_daw_beta_workflow_receipts where owner_id=v_owner and session_id=p_session_id order by observed_at desc limit 1)row;
 select coalesce(jsonb_agg(to_jsonb(row) order by row.created_at desc),'[]'::jsonb) into v_feedback from(
  select f.id,f.stage,f.severity,f.reproducibility,f.summary,f.expected_behavior,f.reproduction_notes,f.state,f.checkpoint_checksum,f.created_at,
   case when f.state='reopened' then 'test-again' when exists(select 1 from public.timeline_daw_beta_feedback_events le where le.feedback_id=f.id and le.event='responded' and le.actor_id<>v_actor and le.created_at=(select max(me.created_at) from public.timeline_daw_beta_feedback_events me where me.feedback_id=f.id and me.event='responded')) then 'reply-needed' else 'current' end as review_status
  from public.timeline_daw_beta_feedback f where f.owner_id=v_owner and f.session_id=p_session_id and(v_role='owner' or exists(select 1 from public.timeline_daw_beta_feedback_events e where e.feedback_id=f.id and e.actor_id=v_actor and e.event='created'))
 )row;
 select coalesce(jsonb_agg(to_jsonb(row) order by row.created_at),'[]'::jsonb) into v_events from(
  select e.id,e.feedback_id,e.actor_id,e.event,e.before_state,e.after_state,e.response,e.event_checksum,e.created_at
  from public.timeline_daw_beta_feedback_events e where e.owner_id=v_owner and e.session_id=p_session_id and(v_role='owner' or exists(select 1 from public.timeline_daw_beta_feedback_events mine where mine.feedback_id=e.feedback_id and mine.actor_id=v_actor and mine.event='created'))
 )row;
 return jsonb_build_object('access',v_access,'workflow',v_workflow,'feedback',v_feedback,'events',v_events,'currentActorId',v_actor);
end$$;

create or replace function public.respond_timeline_daw_beta_collaborator_feedback(p_session_id text,p_feedback_id text,p_response text) returns jsonb
language plpgsql security definer set search_path=public as $$
declare v_access jsonb;v_owner uuid;v_actor uuid:=auth.uid();v_event_id text:='timeline-daw-beta-event-'||gen_random_uuid()::text;v_created timestamptz:=clock_timestamp();v_checksum text;
begin
 v_access:=public.authorize_timeline_daw_beta_session(p_session_id,'feedback:respond','respond-beta-feedback',null);
 if not coalesce((v_access->>'allowed')::boolean,false) then raise exception '%',v_access->>'reason';end if;
 v_owner:=(v_access->>'ownerId')::uuid;
 if length(trim(coalesce(p_response,''))) not between 2 and 4000 then raise exception 'Response must contain 2-4000 characters';end if;
 if not exists(select 1 from public.timeline_daw_beta_feedback f where f.id=p_feedback_id and f.owner_id=v_owner and f.session_id=p_session_id and exists(select 1 from public.timeline_daw_beta_feedback_events e where e.feedback_id=f.id and e.actor_id=v_actor and e.event='created')) then raise exception 'Tester-owned feedback was not found';end if;
 v_checksum:='sha256:'||encode(digest(v_event_id||'|'||p_feedback_id||'|'||v_actor::text||'|responded|'||trim(p_response)||'|'||v_created::text,'sha256'),'hex');
 insert into public.timeline_daw_beta_feedback_events(id,owner_id,session_id,feedback_id,actor_id,event,response,event_checksum,created_at) values(v_event_id,v_owner,p_session_id,p_feedback_id,v_actor,'responded',trim(p_response),v_checksum,v_created);
 return jsonb_build_object('id',v_event_id,'feedbackId',p_feedback_id,'actorId',v_actor,'response',trim(p_response),'eventChecksum',v_checksum,'createdAt',v_created);
end$$;
revoke all on function public.respond_timeline_daw_beta_collaborator_feedback(text,text,text) from public,anon;
grant execute on function public.respond_timeline_daw_beta_collaborator_feedback(text,text,text) to authenticated;