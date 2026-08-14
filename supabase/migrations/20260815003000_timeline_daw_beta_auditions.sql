create table if not exists public.timeline_daw_beta_audition_sources(
 id text primary key,owner_id uuid not null references auth.users(id) on delete cascade,session_id text not null,
 master_proof_id text not null references public.timeline_daw_normalization_master_proofs(id) on delete restrict,
 revision integer not null,label text not null,source_uri text not null,source_checksum text not null check(source_checksum~'^sha256:[a-f0-9]{64}$'),
 state text not null check(state in('active','revoked')),selected_at timestamptz not null,created_at timestamptz not null default now()
);
create unique index if not exists timeline_daw_beta_audition_one_active on public.timeline_daw_beta_audition_sources(owner_id,session_id) where state='active';
create table if not exists public.timeline_daw_beta_audition_receipts(
 id text primary key,owner_id uuid not null references auth.users(id) on delete cascade,actor_id uuid not null references auth.users(id) on delete cascade,
 session_id text not null,source_id text not null references public.timeline_daw_beta_audition_sources(id) on delete restrict,
 event text not null check(event in('audition-opened','playback-started','playback-completed','playback-failed','feedback-checkpoint')),
 position_seconds double precision not null check(position_seconds between 0 and 86400),detail text not null default '',receipt_checksum text not null check(receipt_checksum~'^sha256:[a-f0-9]{64}$'),observed_at timestamptz not null,created_at timestamptz not null default now()
);
create index if not exists timeline_daw_beta_audition_receipts_session_idx on public.timeline_daw_beta_audition_receipts(owner_id,session_id,observed_at desc);
alter table public.timeline_daw_beta_audition_sources enable row level security;
alter table public.timeline_daw_beta_audition_receipts enable row level security;
create policy timeline_daw_beta_audition_sources_owner on public.timeline_daw_beta_audition_sources for all to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
create policy timeline_daw_beta_audition_receipts_participant on public.timeline_daw_beta_audition_receipts for select to authenticated using(owner_id=auth.uid() or actor_id=auth.uid());

create or replace function public.get_timeline_daw_beta_audition(p_session_id text) returns jsonb language plpgsql security definer set search_path=public as $$
declare v_access jsonb;v_source public.timeline_daw_beta_audition_sources;
begin
 v_access:=public.authorize_timeline_daw_beta_session(p_session_id,'transport:read','open-beta-audition',null);
 if not coalesce((v_access->>'allowed')::boolean,false) then raise exception '%',v_access->>'reason';end if;
 select * into v_source from public.timeline_daw_beta_audition_sources where owner_id=(v_access->>'ownerId')::uuid and session_id=p_session_id and state='active' order by selected_at desc limit 1;
 if v_source.id is null then raise exception 'The owner has not published a beta audition master';end if;
 return jsonb_build_object('access',v_access,'source',jsonb_build_object('id',v_source.id,'label',v_source.label,'revision',v_source.revision,'sourceUri',v_source.source_uri,'sourceChecksum',v_source.source_checksum,'selectedAt',v_source.selected_at));
end$$;
revoke all on function public.get_timeline_daw_beta_audition(text) from public,anon;grant execute on function public.get_timeline_daw_beta_audition(text) to authenticated;

create or replace function public.record_timeline_daw_beta_audition(p_session_id text,p_source_id text,p_event text,p_position_seconds double precision,p_detail text,p_receipt_checksum text,p_observed_at timestamptz) returns text language plpgsql security definer set search_path=public as $$
declare v_access jsonb;v_id text:='timeline-daw-beta-audition-receipt-'||gen_random_uuid()::text;
begin
 v_access:=public.authorize_timeline_daw_beta_session(p_session_id,'transport:read','record-beta-audition-'||p_event,null);
 if not coalesce((v_access->>'allowed')::boolean,false) then raise exception '%',v_access->>'reason';end if;
 if p_event not in('audition-opened','playback-started','playback-completed','playback-failed','feedback-checkpoint') then raise exception 'Audition event is invalid';end if;
 if p_position_seconds<0 or p_position_seconds>86400 or length(coalesce(p_detail,''))>500 or p_receipt_checksum!~'^sha256:[a-f0-9]{64}$' then raise exception 'Audition evidence is invalid';end if;
 if not exists(select 1 from public.timeline_daw_beta_audition_sources where id=p_source_id and owner_id=(v_access->>'ownerId')::uuid and session_id=p_session_id and state='active') then raise exception 'Active audition source was not found';end if;
 insert into public.timeline_daw_beta_audition_receipts(id,owner_id,actor_id,session_id,source_id,event,position_seconds,detail,receipt_checksum,observed_at) values(v_id,(v_access->>'ownerId')::uuid,auth.uid(),p_session_id,p_source_id,p_event,p_position_seconds,coalesce(p_detail,''),p_receipt_checksum,p_observed_at);return v_id;
end$$;
revoke all on function public.record_timeline_daw_beta_audition(text,text,text,double precision,text,text,timestamptz) from public,anon;grant execute on function public.record_timeline_daw_beta_audition(text,text,text,double precision,text,text,timestamptz) to authenticated;

create policy timeline_daw_beta_selected_master_read on storage.objects for select to authenticated using(
 bucket_id='timeline-daw-render-sources' and exists(select 1 from public.timeline_daw_beta_audition_sources source where source.state='active' and source.source_uri='supabase://timeline-daw-render-sources/'||storage.objects.name and(source.owner_id=auth.uid() or exists(select 1 from public.timeline_daw_beta_enrollments enrollment where enrollment.owner_id=source.owner_id and enrollment.session_id=source.session_id and enrollment.tester_id=auth.uid() and enrollment.state='active' and exists(select 1 from public.timeline_daw_beta_release_receipts release where release.enrollment_id=enrollment.id and release.ready=true))))
);
