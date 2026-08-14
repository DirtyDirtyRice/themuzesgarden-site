alter table public.timeline_daw_beta_enrollments drop constraint if exists timeline_daw_beta_enrollments_state_check;
alter table public.timeline_daw_beta_enrollments add constraint timeline_daw_beta_enrollments_state_check check(state in('active','paused','completed','revoked'));
create table if not exists public.timeline_daw_beta_tester_operations(
 id text primary key,owner_id uuid not null references auth.users(id) on delete cascade,tester_id uuid not null references auth.users(id) on delete cascade,
 session_id text not null,enrollment_id text not null references public.timeline_daw_beta_enrollments(id) on delete restrict,
 operation text not null check(operation in('pause','resume','complete','revoke')),before_state text not null,after_state text not null,reason text not null,
 receipt_checksum text not null check(receipt_checksum~'^sha256:[a-f0-9]{64}$'),observed_at timestamptz not null,created_at timestamptz not null default now()
);
create table if not exists public.timeline_daw_beta_release_packages(
 id text primary key,owner_id uuid not null references auth.users(id) on delete cascade,session_id text not null,ready boolean not null,
 package jsonb not null,compatibility_summary text not null,receipt_checksum text not null check(receipt_checksum~'^sha256:[a-f0-9]{64}$'),observed_at timestamptz not null,created_at timestamptz not null default now()
);
create index if not exists timeline_daw_beta_tester_operations_session_idx on public.timeline_daw_beta_tester_operations(owner_id,session_id,observed_at desc);
create index if not exists timeline_daw_beta_release_packages_session_idx on public.timeline_daw_beta_release_packages(owner_id,session_id,observed_at desc);
alter table public.timeline_daw_beta_tester_operations enable row level security;alter table public.timeline_daw_beta_release_packages enable row level security;
create policy timeline_daw_beta_tester_operations_participant on public.timeline_daw_beta_tester_operations for select to authenticated using(owner_id=auth.uid() or tester_id=auth.uid());
create policy timeline_daw_beta_release_packages_owner on public.timeline_daw_beta_release_packages for all to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
create or replace function public.operate_timeline_daw_beta_tester(p_session_id text,p_enrollment_id text,p_operation text,p_next_state text,p_reason text,p_receipt_checksum text,p_observed_at timestamptz) returns jsonb language plpgsql security definer set search_path=public as $$
declare v_row public.timeline_daw_beta_enrollments;v_id text:='timeline-daw-beta-operation-'||gen_random_uuid()::text;
begin
 if auth.uid() is null then raise exception 'Authentication is required';end if;
 select * into v_row from public.timeline_daw_beta_enrollments where id=p_enrollment_id and session_id=p_session_id and owner_id=auth.uid() for update;
 if v_row.id is null then raise exception 'Owner-controlled tester enrollment was not found';end if;
 if p_operation not in('pause','resume','complete','revoke') or p_next_state not in('active','paused','completed','revoked') or length(trim(coalesce(p_reason,''))) not between 5 and 500 or p_receipt_checksum!~'^sha256:[a-f0-9]{64}$' then raise exception 'Tester operation evidence is invalid';end if;
 if not((v_row.state='active' and(p_operation,p_next_state) in(('pause','paused'),('complete','completed'),('revoke','revoked')))or(v_row.state='paused' and(p_operation,p_next_state) in(('resume','active'),('complete','completed'),('revoke','revoked')))or(v_row.state='completed' and(p_operation,p_next_state) in(('resume','active'),('revoke','revoked'))))then raise exception 'Tester state transition is not allowed';end if;
 update public.timeline_daw_beta_enrollments set state=p_next_state,updated_at=clock_timestamp() where id=v_row.id;
 insert into public.timeline_daw_beta_tester_operations(id,owner_id,tester_id,session_id,enrollment_id,operation,before_state,after_state,reason,receipt_checksum,observed_at)values(v_id,v_row.owner_id,v_row.tester_id,p_session_id,v_row.id,p_operation,v_row.state,p_next_state,trim(p_reason),p_receipt_checksum,p_observed_at);
 return jsonb_build_object('id',v_id,'testerId',v_row.tester_id,'beforeState',v_row.state,'afterState',p_next_state,'observedAt',p_observed_at);
end$$;
revoke all on function public.operate_timeline_daw_beta_tester(text,text,text,text,text,text,timestamptz) from public,anon;grant execute on function public.operate_timeline_daw_beta_tester(text,text,text,text,text,text,timestamptz) to authenticated;
