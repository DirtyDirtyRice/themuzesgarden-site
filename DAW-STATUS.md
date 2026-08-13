# The Muzes Garden DAW - Development Status

Last updated: August 13, 2026

## Current objective

Build a credible professional DAW that musicians can use in a closed beta, while preserving the original AI-assisted and historical-ledger vision. Work proceeds by complete milestones: implementation, focused tests, production build, commit, push, and this status update.

## Latest completed milestone - Normalization Worker Scheduling and Approval Review UX

Normalization queues can now wake unattended on deployment, while musicians get explicit approval and retention review controls.

- Add a Vercel cron wakeup every five minutes for bounded normalization work.
- Authenticate scheduled calls with a rotating CRON_SECRET bearer credential.
- Keep SUPABASE_SERVICE_ROLE_KEY exclusively inside the server worker route.
- Discover eligible queues through a service-role-only global claim function that is revoked from browser roles.
- Process at most three leased jobs or 240 seconds per scheduled invocation.
- Persist worker-run timing, claimed/completed/failed counts, failures, and next-wakeup decisions.
- Show the latest scheduled worker outcome and live queue health inside the owner session.
- Display approval revision, decision, dependency fingerprint, reviewer notes, and history.
- Support explicit approval revocation for another listening pass.
- Provide signed private master download with checksum-backed provenance.
- Preview artifact count and byte size before retention decisions.
- Require an exact typed confirmation before pruning superseded private artifacts.

### Verification

- Focused normalization approval, queue, and renderer tests passed.
- TypeScript validation passed.
- Next.js production build passed.
- Supabase migration 20260814003000 applied successfully.
- Deployment requires rotating CRON_SECRET and server-only SUPABASE_SERVICE_ROLE_KEY environment values.
- Existing code-map warning remains non-blocking and unrelated.
## Previously completed DAW foundation

- Durable DAW workspaces and authenticated project sessions.
- Timeline transport and playback foundations.
- PCM WAV render worker and live render execution.
- Private render-artifact persistence.
- Stem ZIP export delivery.
- Durable interchange delivery.
- Recovery checkpoints.
- Device and latency diagnostics.
- Live WAV and MP3 recording.
- Private recording-take persistence and management.
- Private take audition.
- AudioWorklet recording capture with compatibility fallback.
- Input-level and clipping safety.
- Preferred-take selection.
- Recording take review, notes, ratings, and renaming.
- Durable non-destructive take comp recipes and ordered preview.
- Sample-accurate comp WAV rendering and private delivery.
- Checksum-verified comp promotion with durable source provenance.
- Durable transport-synchronized private audio source lanes.
- Persistent private-lane mute, solo, gain, pan, and metering.
- Durable frame-normalized lane fades and automatic compatible equal-power crossfades.
- Atomic sample-aligned lane splits with continuous non-destructive region boundaries.
- Checksum-cached private waveforms with timeline-proportional direct region editing.
- Durable private-lane edit receipts with atomic conflict-aware undo and redo.
- Explicit multi-region selection with atomic reversible move, mixer, and fade edits.
- Timeline comments and review workflow with sample-addressed threads and transport-linked audition.
- Immutable versioned session snapshots with structural compare, A/B audition, and guarded restore.
- Sample-aligned clip gain envelopes and non-destructive spectral repair recipes.
- Persistent MIDI sequencing, controller events, quantization, virtual-instrument preview, SMF export, and snapshot coverage.
- Related-version alignment, private A/B comparison, timeline review decisions, and reversible alignment history.
- Punch-range, tempo-aware count-in, and grouped multi-pass loop recording.
- Reproducible checksum-pinned creative song experiments with private WAV/MP3 renders.
- Real five-song tempo/key detection, normalization planning, local before/after auditions, and proof mixing.
- Authenticated normalization review revisions and promotion into durable private DAW lanes.

## Next milestone - Normalization Operations Dashboard and Worker Alerts

Make unattended processing observable and actionable when anything stalls or fails.

Planned outcome:

1. Add an owner-scoped operations view for queue depth, lease age, throughput, failure rate, and storage use.
2. Classify retryable versus terminal render failures and enforce bounded exponential backoff.
3. Persist alerts for stale leases, repeated failures, approval invalidation, and storage-prune failures.
4. Add acknowledge, retry, and resolve actions with immutable operator receipts.
5. Show master delivery history and approval/retention timelines together.
6. Add health checks for cron freshness and required deployment configuration without exposing secrets.
7. Run focused tests, production build, reviewed migration, commit, and push.
## Working rules

- Preserve existing architecture and user data.
- Work one file at a time and keep each completed milestone build-green.
- No placeholders, TODOs, or nonfunctional buttons.
- Prefer reusable engine and policy code over page-specific logic.
- Use focused tests during implementation and one full production build before pushing.
- Commit and push only milestone-related files; leave unrelated user documents and temporary files untouched.
- Push completed milestone commits autonomously; do not ask the user to approve routine pushes.
- Update this file at the end of every milestone.

## Resume instruction

Start a new Codex task and say:

> Read `DAW-STATUS.md` and complete the next DAW milestone autonomously. Work one file at a time, run focused tests, run the full production build, apply any reviewed migration, commit, push without asking for routine push approval, and update `DAW-STATUS.md`.
