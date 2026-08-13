# The Muzes Garden DAW - Development Status

Last updated: August 13, 2026

## Current objective

Build a credible professional DAW that musicians can use in a closed beta, while preserving the original AI-assisted and historical-ledger vision. Work proceeds by complete milestones: implementation, focused tests, production build, commit, push, and this status update.

## Latest completed milestone - Durable Background Normalization Queue and Live A/B Transport

Normalization rendering now uses recoverable, owner-scoped leased jobs and synchronized DAW comparison playback.

- Enqueue idempotent per-song jobs without performing the full render in the request that creates them.
- Atomically claim one eligible job through a row-locked database function.
- Attach bounded worker leases, worker identity, lease tokens, heartbeats, and attempt counts.
- Reject stale completion when a lease expires, changes owner, or receives a cancellation request.
- Reclaim interrupted rendering work after lease expiry without duplicating completed artifacts.
- Keep completed artifact checksums immutable and exclude them from subsequent claims.
- Persist artifact RMS for repeatable bounded loudness matching.
- Process one song at a time and expose queue, worker, retry, and cancellation controls in the session.
- Follow DAW play, pause, and locate events with two synchronized private revision players.
- Switch A/B instantly by gain while preserving shared playback position.
- Gate current master creation on a complete current-revision artifact set.

### Verification

- Focused normalization queue, renderer, review, and elastic-transform tests passed.
- TypeScript validation passed.
- Next.js production build passed.
- Supabase migration 20260813213000 applied successfully.
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

## Next milestone - Automated Queue Runner and Normalization Approval Ledger

Finish hands-off render processing and make musician approval cryptographically specific to the audible revision.

Planned outcome:

1. Add a protected worker endpoint that drains leased jobs within a bounded execution window.
2. Schedule authenticated queue wakeups and continue automatically until the revision is drained.
3. Persist approval decisions against proof revision, recipe checksums, artifact checksums, and master checksum.
4. Invalidate approval automatically whenever any dependency becomes stale or is superseded.
5. Add artifact retention decisions with safe storage deletion and immutable audit receipts.
6. Show queue health, lease recovery, approval readiness, and retention state in the DAW.
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
