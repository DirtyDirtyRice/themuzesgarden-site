drop policy if exists "public projects are readable" on public.projects;

create policy "public projects are readable"
on public.projects
for select
to anon, authenticated
using (visibility = 'public');
