create table if not exists public.timeline_daw_beta_launches(
 id text primary key,owner_id uuid not null references auth.users(id) on delete cascade,session_id text not null,label text not null,state text not null check(state in('active','paused','closed')),
 package_id text not null references public.timeline_daw_beta_release_packages(id) on delete restrict,package_checksum text not null,reason text not null,
 manifest jsonb not null,receipt_checksum text not null check(receipt_checksum~'^sha256:[a-f0-9]{64}$'),launched_at timestamptz not null,updated_at timestamptz not null,created_at timestamptz not null default now()
);
create table if not exists public.timeline_daw_beta_launch_testers(
 launch_id text not null references public.timeline_daw_beta_launches(id) on delete restrict,enrollment_id text not null references public.timeline_daw_beta_enrollments(id) on delete restrict,
 owner_id uuid not null references auth.users(id) on delete cascade,tester_id uuid not null references auth.users(id) on delete cascade,certification_id text not null references public.timeline_daw_beta_readiness_certifications(id) on delete restrict,
 certification_checksum text not null,joined_at timestamptz not null,primary key(launch_id,enrollment_id)
);
create table if not exists public.timeline_daw_beta_launch_operations(
 id text primary key,launch_id text not null references public.timeline_daw_beta_launches(id) on delete restrict,owner_id uuid not null references auth.users(id) on delete cascade,session_id text not null,
 operation text not null check(operation in('launch','pause','resume','close')),before_state text,after_state text not null,reason text not null,receipt_checksum text not null check(receipt_checksum~'^sha256:[a-f0-9]{64}$'),observed_at timestamptz not null,created_at timestamptz not null default now()
);
create index if not exists timeline_daw_beta_launches_session_idx on public.timeline_daw_beta_launches(owner_id,session_id,launched_at desc);
alter table public.timeline_daw_beta_launches enable row level security;alter table public.timeline_daw_beta_launch_testers enable row level security;alter table public.timeline_daw_beta_launch_operations enable row level security;
create policy timeline_daw_beta_launches_owner on public.timeline_daw_beta_launches for all to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
create policy timeline_daw_beta_launch_testers_participant on public.timeline_daw_beta_launch_testers for select to authenticated using(owner_id=auth.uid() or tester_id=auth.uid());
create policy timeline_daw_beta_launch_testers_owner_insert on public.timeline_daw_beta_launch_testers for insert to authenticated with check(owner_id=auth.uid());
create policy timeline_daw_beta_launch_operations_owner on public.timeline_daw_beta_launch_operations for all to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());

create or replace function public.create_timeline_daw_beta_launch(p_id text,p_session_id text,p_label text,p_package_id text,p_reason text,p_manifest jsonb,p_receipt_checksum text,p_launched_at timestamptz,p_testers jsonb) returns text language plpgsql security definer set search_path=public as $$
declare item jsonb;cert public.timeline_daw_beta_readiness_certifications;enrollment public.timeline_daw_beta_enrollments;package public.timeline_daw_beta_release_packages;operation_checksum text;
begin
 if auth.uid() is null then raise exception 'Authentication is required';end if;
 if length(trim(p_label)) not between 3 and 120 or length(trim(p_reason)) not between 5 and 500 or jsonb_array_length(p_testers)<1 then raise exception 'Launch label, reason, and at least one tester are required';end if;
 select * into package from public.timeline_daw_beta_release_packages where id=p_package_id and owner_id=auth.uid() and session_id=p_session_id and ready=true;
 if package.id is null then raise exception 'A current ready release package is required';end if;
 insert into public.timeline_daw_beta_launches(id,owner_id,session_id,label,state,package_id,package_checksum,reason,manifest,receipt_checksum,launched_at,updated_at) values(p_id,auth.uid(),p_session_id,trim(p_label),'active',package.id,package.receipt_checksum,trim(p_reason),p_manifest,p_receipt_checksum,p_launched_at,p_launched_at);
 for item in select * from jsonb_array_elements(p_testers) loop
  select * into cert from public.timeline_daw_beta_readiness_certifications where id=item->>'certificationId' and owner_id=auth.uid() and session_id=p_session_id and ready=true and receipt_checksum=item->>'certificationChecksum';
  if cert.id is null then raise exception 'Every launch tester requires a matching ready certification';end if;
  select * into enrollment from public.timeline_daw_beta_enrollments where id=cert.enrollment_id and owner_id=auth.uid() and session_id=p_session_id and tester_id=cert.tester_id and state='active';
  if enrollment.id is null then raise exception 'Every launch tester must have an active matching enrollment';end if;
  insert into public.timeline_daw_beta_launch_testers(launch_id,enrollment_id,owner_id,tester_id,certification_id,certification_checksum,joined_at) values(p_id,enrollment.id,auth.uid(),enrollment.tester_id,cert.id,cert.receipt_checksum,p_launched_at);
 end loop;
 operation_checksum:='sha256:'||encode(digest(p_id||'|launch||active|'||trim(p_reason)||'|'||p_launched_at::text,'sha256'),'hex');
 insert into public.timeline_daw_beta_launch_operations(id,launch_id,owner_id,session_id,operation,before_state,after_state,reason,receipt_checksum,observed_at) values('timeline-daw-beta-launch-operation-'||gen_random_uuid()::text,p_id,auth.uid(),p_session_id,'launch',null,'active',trim(p_reason),operation_checksum,p_launched_at);
 return p_id;
end$$;
create or replace function public.operate_timeline_daw_beta_launch(p_launch_id text,p_operation text,p_next_state text,p_reason text,p_receipt_checksum text,p_observed_at timestamptz) returns text language plpgsql security definer set search_path=public as $$
declare launch public.timeline_daw_beta_launches;operation_id text:='timeline-daw-beta-launch-operation-'||gen_random_uuid()::text;
begin
 select * into launch from public.timeline_daw_beta_launches where id=p_launch_id and owner_id=auth.uid() for update;if launch.id is null then raise exception 'Launch was not found';end if;
 if length(trim(p_reason)) not between 5 and 500 then raise exception 'Launch reason is invalid';end if;
 if not((launch.state='active' and p_operation in('pause','close') and p_next_state in('paused','closed'))or(launch.state='paused' and p_operation in('resume','close') and p_next_state in('active','closed')))then raise exception 'Launch state transition is invalid';end if;
 update public.timeline_daw_beta_launches set state=p_next_state,updated_at=p_observed_at where id=launch.id;
 insert into public.timeline_daw_beta_launch_operations(id,launch_id,owner_id,session_id,operation,before_state,after_state,reason,receipt_checksum,observed_at) values(operation_id,launch.id,auth.uid(),launch.session_id,p_operation,launch.state,p_next_state,trim(p_reason),p_receipt_checksum,p_observed_at);return operation_id;
end$$;
revoke all on function public.create_timeline_daw_beta_launch(text,text,text,text,text,jsonb,text,timestamptz,jsonb) from public,anon;grant execute on function public.create_timeline_daw_beta_launch(text,text,text,text,text,jsonb,text,timestamptz,jsonb) to authenticated;
revoke all on function public.operate_timeline_daw_beta_launch(text,text,text,text,text,timestamptz) from public,anon;grant execute on function public.operate_timeline_daw_beta_launch(text,text,text,text,text,timestamptz) to authenticated;