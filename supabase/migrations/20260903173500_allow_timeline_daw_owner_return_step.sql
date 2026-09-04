alter table public.timeline_daw_owner_test_observations
  drop constraint if exists timeline_daw_owner_test_observations_step_check;

alter table public.timeline_daw_owner_test_observations
  add constraint timeline_daw_owner_test_observations_step_check
  check (step in ('protect','import','audition','edit','mix','recover','return','export'));
