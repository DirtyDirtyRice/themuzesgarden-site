alter table public.timeline_daw_recording_takes
  add column if not exists recording_mode text not null default 'normal'
    check (recording_mode in ('normal', 'punch', 'loop')),
  add column if not exists take_group_id text,
  add column if not exists pass_number integer not null default 1 check (pass_number between 1 and 99),
  add column if not exists timeline_start_frame bigint not null default 0 check (timeline_start_frame >= 0),
  add column if not exists source_in_frame bigint not null default 0 check (source_in_frame >= 0),
  add column if not exists source_out_frame bigint check (source_out_frame > source_in_frame),
  add column if not exists count_in_bars integer not null default 0 check (count_in_bars between 0 and 8);

alter table public.timeline_daw_recording_takes
  drop constraint if exists timeline_daw_recording_takes_owner_id_session_id_source_id_key;

create unique index if not exists timeline_daw_recording_takes_source_pass_idx
on public.timeline_daw_recording_takes (owner_id, session_id, source_id, pass_number);

create index if not exists timeline_daw_recording_takes_group_pass_idx
on public.timeline_daw_recording_takes (owner_id, session_id, take_group_id, pass_number)
where take_group_id is not null;
