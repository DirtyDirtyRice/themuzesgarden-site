create table if not exists public.timeline_daw_beta_readiness_certifications(
 id text primary key,owner_id uuid not null references auth.users(id) on delete cascade,tester_id uuid not null references auth.users(id) on delete cascade,
 session_id text not null,enrollment_id text not null references public.timeline_daw_beta_enrollments(id) on delete restrict,ready boolean not null,
 checks jsonb not null,blockers jsonb not null,receipt_checksum text not null check(receipt_checksum~'^sha256:[a-f0-9]{64}$'),observed_at timestamptz not null,created_at timestamptz not null default now()
);
create index if not exists timeline_daw_beta_certification_session_idx on public.timeline_daw_beta_readiness_certifications(owner_id,session_id,observed_at desc);
alter table public.timeline_daw_beta_readiness_certifications enable row level security;
create policy timeline_daw_beta_certification_participant_read on public.timeline_daw_beta_readiness_certifications for select to authenticated using(owner_id=auth.uid() or tester_id=auth.uid());
create policy timeline_daw_beta_certification_owner_insert on public.timeline_daw_beta_readiness_certifications for insert to authenticated with check(owner_id=auth.uid());

create or replace function public.get_timeline_daw_beta_tester_portal() returns jsonb language sql security definer set search_path=public as $$
 select coalesce(jsonb_agg(jsonb_build_object(
  'enrollmentId',e.id,'projectId',e.project_id,'sessionId',e.session_id,'state',e.state,'acknowledged',e.acknowledged_at is not null,
  'environmentReady',e.environment_checked_at is not null and coalesce((e.environment->>'secureContext')::boolean,false) and coalesce((e.environment->>'supportedBrowser')::boolean,false) and coalesce((e.environment->>'audioInput')::boolean,false) and coalesce((e.environment->>'audioOutput')::boolean,false) and coalesce((e.environment->>'localStorage')::boolean,false) and coalesce((e.environment->>'fileApi')::boolean,false) and coalesce((e.environment->>'supportedAudioTypes')::boolean,false),
  'released',exists(select 1 from public.timeline_daw_beta_release_receipts r where r.enrollment_id=e.id and r.ready=true),
  'entryUrl','/workspace/daw/beta/session/'||e.session_id,
  'package',(select jsonb_build_object('generatedAt',p.observed_at,'ready',p.ready,'requirements',p.package->'requirements','privacy',p.package->'privacy','blockers',p.package->'blockers','entryUrl',p.package->'entryUrl','receiptChecksum',p.receipt_checksum) from public.timeline_daw_beta_release_packages p where p.owner_id=e.owner_id and p.session_id=e.session_id order by p.observed_at desc limit 1),
  'certification',(select jsonb_build_object('ready',c.ready,'checks',c.checks,'blockers',c.blockers,'receiptChecksum',c.receipt_checksum,'observedAt',c.observed_at) from public.timeline_daw_beta_readiness_certifications c where c.enrollment_id=e.id order by c.observed_at desc limit 1)
 ) order by e.created_at desc),'[]'::jsonb) from public.timeline_daw_beta_enrollments e where e.tester_id=auth.uid();
$$;
revoke all on function public.get_timeline_daw_beta_tester_portal() from public,anon;grant execute on function public.get_timeline_daw_beta_tester_portal() to authenticated;
