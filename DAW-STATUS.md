# The Muzes Garden DAW - Development Status

Last updated: August 13, 2026

## Current objective

Build a credible professional DAW that musicians can use in a closed beta, while preserving the original AI-assisted and historical-ledger vision. Work proceeds by complete milestones: implementation, focused tests, production build, commit, push, and this status update.

## Latest completed milestone - Automated Queue Runner and Normalization Approval Ledger

The session can now drain normalization work automatically and record approval against the exact audible artifacts.

- Run a bounded authenticated queue drain that repeatedly claims one leased song job at a time.
- Stop automatically when the current revision is drained or the execution/job budget is reached.
- Continue safely on another wakeup because claims are leased and completed artifacts are idempotent.
- Expose queued, running, failed, completed, and lease-recoverable counts in the DAW.
- Persist musician approval against proof revision checksum, every recipe checksum, every artifact checksum, and master checksum.
- Reuse approval only when every audible dependency still matches exactly.
- Require a complete current render set and current rendered master before approval.
- Record explicit retain or prune decisions in immutable owner-scoped receipts.
- Protect current and approved revisions from artifact pruning.
- Delete only verified session-private superseded storage paths after an explicit prune decision.
- Preserve checksums and deleted paths in the retention audit ledger.

### Verification

- Focused normalization approval, queue, and renderer tests passed.
- TypeScript validation passed.
- Next.js production build passed.
- Supabase migration 20260813230000 applied successfully.
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

## Next milestone - Normalization Worker Scheduling and Approval Review UX

Operationalize unattended queue wakeups and make audible approval/staleness unmistakable to musicians.

Planned outcome:

1. Add a deployment-compatible scheduled wakeup with a narrowly scoped rotating worker credential.
2. Discover and drain eligible owner queues without exposing service-role credentials to the browser.
3. Persist worker-run summaries, timing, failures, and next-wakeup decisions.
4. Show current approval, stale dependency details, reviewer notes, and revocation controls.
5. Add master audition and downloadable delivery alongside the approval ledger.
6. Add retention preview with byte counts and a confirmation checkpoint before pruning.
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
