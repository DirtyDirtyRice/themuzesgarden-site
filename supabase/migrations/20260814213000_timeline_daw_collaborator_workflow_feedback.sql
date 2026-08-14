create or replace function public.get_timeline_daw_beta_collaboration(p_session_id text) returns jsonb
language plpgsql security definer set search_path=public as $$
declare v_access jsonb;v_owner uuid;v_actor uuid:=auth.uid();v_role text;v_workflow jsonb;v_feedback jsonb;
begin
 v_access:=public.authorize_timeline_daw_beta_session(p_session_id,'workflow:read','read-beta-workflow',null);
 if not coalesce((v_access->>'allowed')::boolean,false) then raise exception '%',v_access->>'reason';end if;
 v_owner:=(v_access->>'ownerId')::uuid;v_role:=v_access->>'role';
 select to_jsonb(row) into v_workflow from(select id,stage,completed,required,evidence,evaluation,receipt_checksum,observed_at from public.timeline_daw_beta_workflow_receipts where owner_id=v_owner and session_id=p_session_id order by observed_at desc limit 1)row;
 select coalesce(jsonb_agg(to_jsonb(row) order by row.created_at desc),'[]'::jsonb) into v_feedback from(
  select f.id,f.stage,f.severity,f.reproducibility,f.summary,f.expected_behavior,f.reproduction_notes,f.state,f.checkpoint_checksum,f.created_at
  from public.timeline_daw_beta_feedback f where f.owner_id=v_owner and f.session_id=p_session_id and(v_role='owner' or exists(select 1 from public.timeline_daw_beta_feedback_events e where e.feedback_id=f.id and e.actor_id=v_actor and e.event='created'))
 )row;
 return jsonb_build_object('access',v_access,'workflow',v_workflow,'feedback',v_feedback);
end$$;

create or replace function public.submit_timeline_daw_beta_collaborator_feedback(
 p_session_id text,p_checkpoint_checksum text,p_stage text,p_severity text,p_reproducibility text,p_summary text,p_expected_behavior text,p_reproduction_notes text
) returns jsonb language plpgsql security definer set search_path=public as $$
declare v_access jsonb;v_owner uuid;v_actor uuid:=auth.uid();v_id text:='timeline-daw-beta-feedback-'||gen_random_uuid()::text;v_event_id text:='timeline-daw-beta-event-'||gen_random_uuid()::text;v_created timestamptz:=clock_timestamp();v_feedback_checksum text;v_event_checksum text;
begin
 v_access:=public.authorize_timeline_daw_beta_session(p_session_id,'feedback:create','submit-beta-feedback',null);
 if not coalesce((v_access->>'allowed')::boolean,false) then raise exception '%',v_access->>'reason';end if;
 v_owner:=(v_access->>'ownerId')::uuid;
 if p_stage not in('setup','capture','edit','mix','protect','export') then raise exception 'Feedback stage is invalid';end if;
 if p_severity not in('suggestion','minor','major','blocking') then raise exception 'Feedback severity is invalid';end if;
 if p_reproducibility not in('once','sometimes','always','not-tested') then raise exception 'Feedback reproducibility is invalid';end if;
 if p_checkpoint_checksum!~'^sha256:[a-f0-9]{64}$' or not exists(select 1 from public.timeline_daw_beta_workflow_receipts where owner_id=v_owner and session_id=p_session_id and receipt_checksum=p_checkpoint_checksum) then raise exception 'Save the current workflow checkpoint before submitting feedback';end if;
 if length(trim(p_summary)) not between 5 and 160 then raise exception 'Summary must contain 5-160 characters';end if;
 if length(trim(p_expected_behavior)) not between 5 and 2000 then raise exception 'Expected behavior must contain 5-2000 characters';end if;
 if length(trim(p_reproduction_notes)) not between 5 and 4000 then raise exception 'Reproduction notes must contain 5-4000 characters';end if;
 v_feedback_checksum:='sha256:'||encode(digest(v_id||'|'||v_owner::text||'|'||v_actor::text||'|'||p_session_id||'|'||p_checkpoint_checksum||'|'||p_stage||'|'||p_severity||'|'||p_reproducibility||'|'||trim(p_summary)||'|'||trim(p_expected_behavior)||'|'||trim(p_reproduction_notes)||'|'||v_created::text,'sha256'),'hex');
 insert into public.timeline_daw_beta_feedback(id,owner_id,session_id,checkpoint_checksum,stage,severity,reproducibility,summary,expected_behavior,reproduction_notes,feedback_checksum,created_at,updated_at) values(v_id,v_owner,p_session_id,p_checkpoint_checksum,p_stage,p_severity,p_reproducibility,trim(p_summary),trim(p_expected_behavior),trim(p_reproduction_notes),v_feedback_checksum,v_created,v_created);
 v_event_checksum:='sha256:'||encode(digest(v_event_id||'|'||v_id||'|'||v_actor::text||'|created|'||v_created::text,'sha256'),'hex');
 insert into public.timeline_daw_beta_feedback_events(id,owner_id,session_id,feedback_id,actor_id,event,after_state,event_checksum,created_at) values(v_event_id,v_owner,p_session_id,v_id,v_actor,'created','open',v_event_checksum,v_created);
 return jsonb_build_object('id',v_id,'ownerId',v_owner,'actorId',v_actor,'feedbackChecksum',v_feedback_checksum,'createdAt',v_created);
end$$;
revoke all on function public.get_timeline_daw_beta_collaboration(text) from public,anon;
revoke all on function public.submit_timeline_daw_beta_collaborator_feedback(text,text,text,text,text,text,text,text) from public,anon;
grant execute on function public.get_timeline_daw_beta_collaboration(text) to authenticated;
grant execute on function public.submit_timeline_daw_beta_collaborator_feedback(text,text,text,text,text,text,text,text) to authenticated;