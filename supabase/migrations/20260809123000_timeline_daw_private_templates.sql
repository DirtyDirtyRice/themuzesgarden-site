create table if not exists public.timeline_daw_private_templates (
 id text primary key, owner_id uuid not null references auth.users(id) on delete cascade, name text not null,
 version integer not null check(version>0), favorite boolean not null default false, provenance jsonb not null,
 graph jsonb not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(owner_id,name,version)
);
create table if not exists public.timeline_daw_private_template_applications (
 id text primary key, owner_id uuid not null references auth.users(id) on delete cascade, session_id text not null, template_id text not null,
 created_ids jsonb not null, state text not null default 'applied' check(state in ('applied','undone')), created_at timestamptz not null default now()
);
alter table public.timeline_daw_private_templates enable row level security;alter table public.timeline_daw_private_template_applications enable row level security;
drop policy if exists timeline_daw_private_templates_owner on public.timeline_daw_private_templates;create policy timeline_daw_private_templates_owner on public.timeline_daw_private_templates using(auth.uid()=owner_id) with check(auth.uid()=owner_id);
drop policy if exists timeline_daw_private_template_applications_owner on public.timeline_daw_private_template_applications;create policy timeline_daw_private_template_applications_owner on public.timeline_daw_private_template_applications using(auth.uid()=owner_id) with check(auth.uid()=owner_id);
