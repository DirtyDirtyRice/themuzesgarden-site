# The Muzes Garden DAW - Development Status

Last updated: August 13, 2026

## Current objective

Build a credible professional DAW that musicians can use in a closed beta, while preserving the original AI-assisted and historical-ledger vision. Work proceeds by complete milestones: implementation, focused tests, production build, commit, push, and this status update.

## Latest completed milestone - Normalization Support Evidence Chain Coverage and Backfill

Every support audit export and revocation can now be proven as part of the append-only evidence chain.

- New audit exports and revocations enter the evidence chain automatically at creation time.
- Historical exports and revocations are measured against existing chain links by event type.
- The studio shows export coverage, revocation coverage, overall percentage, and every unchained subject.
- Deterministic backfill plans sort subjects chronologically and bind them to the current chain head.
- Server-side authoritative-plan comparison rejects stale, modified, incomplete, or client-invented plans.
- Exact owner confirmation is required before an append-only backfill runs.
- A unique subject constraint makes historical backfill idempotent and prevents duplicate chain entries.
- Durable backfill receipts record before/after coverage, event counts, plan checksum, and final head hash.
- Extending a sealed chain supersedes the old seal and records a chain-extended event without deleting history.
- Checksum-protected portable coverage receipts can be downloaded and verified locally in the browser.

### Verification

- Focused normalization audit, repair, evidence-seal, and coverage tests passed (11 tests).
- TypeScript validation passed.
- Next.js production build passed.
- Supabase migration 20260814143000 applied successfully.
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

## Completed milestone - Normalization Evidence Chain Monitoring and Recovery

- Authenticated manual scans and a CRON-protected worker inspect every durable DAW session every 15 minutes.
- Immutable checksum-protected checkpoints record chain head, link count, coverage, verification result, issue class, and observation time.
- System incidents distinguish coverage gaps, continuity failures, reconstructed-chain mismatch, subject-checksum mismatch, chronology failure, and unknown integrity failure.
- Monitoring incidents contain no audio or private diagnostic bundle and do not falsely represent owner consent.
- Missing evidence subjects can be append-only recovered through the authoritative coverage plan with exact confirmation and a post-recovery receipt.
- Integrity failures are quarantined for manual investigation and cannot use the automatic append recovery path.
- Incident acknowledgement, recovered state, checkpoint history, and receipt history are visible in each DAW studio.
- Focused policy tests passed (3 tests), TypeScript passed, targeted lint passed, and the production build passed.
- Supabase migration 20260814153000 applied successfully; the existing code-map warning remains unrelated and non-blocking.

## Completed milestone - Evidence Incident Notifications and Escalation

- Unresolved evidence incidents queue idempotent, privacy-safe in-app notifications.
- Integrity incidents escalate after 4 and 24 hours; safe coverage gaps escalate after 24 and 72 hours.
- Every notification links directly to the exact project and DAW session requiring attention.
- Durable delivery attempts and checksum-protected receipts preserve notification evidence.
- Exponential retry delays are capped at four hours, with dead-letter handling after the fifth failed attempt.
- Owners can acknowledge delivered notifications and manually retry dead-lettered notifications.
- The DAW studio displays notification state, severity, escalation level, attempts, and delivery errors.
- A CRON-protected worker processes notifications every 10 minutes.
- Focused policy tests passed (3 tests), TypeScript passed, targeted lint passed, and the production build passed.
- Supabase migration 20260814163000 applied successfully.

## Completed milestone - DAW Beta Workflow Orchestrator

- A real six-stage tester path now coordinates Setup, Capture/Import, Edit, Mix, Protect, and Export.
- Stage completion is calculated from durable DAW records rather than cosmetic checkboxes.
- The studio identifies one exact next action and distinguishes upcoming, completed, export-ready, blocked, and complete states.
- Failed renders and unresolved integrity incidents visibly block delivery without exposing audio or protected diagnostics.
- Checksum-protected, owner-scoped workflow receipts preserve resumable progress history.
- The beta panel is embedded at the top of every authenticated DAW session.
- Focused policy tests passed (3 tests), TypeScript passed, targeted lint passed, and the production build passed.
- Supabase migration 20260814173000 applied successfully; the existing code-map warning remains unrelated and non-blocking.

## Completed milestone - DAW Beta Tester Feedback and Session Reports

- Musicians can submit structured stage-specific feedback with severity, reproducibility, expected behavior, and exact reproduction steps.
- Every report is bound to a real checksum-protected workflow checkpoint; unsaved or invented checkpoints are rejected.
- Reports exclude audio, storage paths, credentials, tokens, and protected diagnostics.
- Issue lifecycle supports open, investigating, resolved, and reopened states with guarded transitions.
- Owner and tester responses are preserved as immutable checksum-protected events.
- The studio dashboard summarizes workflow completion, blockers, export readiness, report totals, and unresolved reports.
- Focused policy tests passed (3 tests), TypeScript passed, targeted lint passed, and the production build passed.
- Supabase migration 20260814183000 applied successfully; the existing code-map warning remains unrelated and non-blocking.

## Completed milestone - Invited Musician Beta Onboarding and Release Gate

- Owners can create labeled seven-day invitation codes; only SHA-256 hashes are stored and the raw code is shown once.
- Authenticated musicians can redeem invitations through a dedicated beta enrollment page.
- Testers must save an explicit privacy/beta-risk acknowledgement and run real browser, audio input/output, storage, File API, and supported-format checks.
- Tester self-service writes use narrowly scoped security-definer functions and cannot alter ownership, identity, project, session, or enrollment state.
- Owners can revoke invitations and related enrollment immediately.
- The release gate combines active enrollment, acknowledgement, environment readiness, workflow completion, verified export readiness, unresolved blocking feedback, and integrity blockers.
- Every release decision is preserved in a checksum-protected owner-scoped receipt.
- Focused policy tests passed (3 tests), TypeScript passed, targeted lint passed, and the production build passed.
- Supabase migration 20260814193000 applied successfully; the existing code-map warning remains unrelated and non-blocking.

## Completed milestone - Collaborator Session Access Boundary

- A central server authorization service now resolves project owners and explicitly enrolled beta collaborators through one capability boundary.
- Collaborator access requires a currently active enrollment, saved beta acknowledgement, passing browser/audio environment report, and a successful owner release receipt.
- Every access attempt is checked live, so owner revocation takes effect on the next request without relying on cached permission.
- Capabilities are explicit and limited to session read, workflow read, feedback create/respond, and transport read; administration and destructive operations remain owner-only.
- Allowed and denied access decisions are stored as participant-readable, checksum-protected receipts.
- Released musicians now have a dedicated session-entry page that displays granted capabilities and recent access receipts.
- Focused policy tests passed (3 tests), TypeScript passed, targeted lint passed, and the production build passed.
- Supabase migration 20260814203000 applied successfully; the existing code-map warning remains unrelated and non-blocking.

## Completed milestone - Collaborator Beta Workflow and Feedback Access

- Released musicians can read the latest owner-scoped six-stage beta workflow through the central capability boundary.
- Workflow reads use a security-definer function rather than opening owner tables to collaborators.
- The musician session page now displays real setup, capture, edit, mix, protect, and export checkpoints with the current next action and blockers.
- Collaborators can submit stage, severity, reproducibility, expected behavior, and exact reproduction steps tied to a real saved workflow checksum.
- Feedback submission is narrowly constrained in the database and cannot update ownership, session identity, issue state, or unrelated reports.
- Each report preserves both the project owner and actual collaborator actor in an immutable feedback event plus access receipts.
- Collaborators see only reports they created; owners retain their full feedback dashboard.
- Focused access and feedback tests passed (6 tests), TypeScript passed, targeted lint passed, and the production build passed.
- Supabase migration 20260814213000 applied successfully; the existing code-map warning remains unrelated and non-blocking.

## Completed milestone - Two-Way Beta Review and Issue Closure

- Owner responses and owner-controlled issue state changes now return only to the collaborator who created the report.
- Released collaborators can add capability-checked follow-up responses but cannot change issue state, ownership, project, session, or another tester's report.
- Each report displays its complete immutable created, responded, and state-change history with the actual owner/tester actor identity.
- Both owner and collaborator views identify when the other participant has supplied the latest response.
- Reopened reports enter an explicit test-again state so the musician knows to verify the fix against the current workflow.
- Owner dashboards show reply-needed and test-again indicators while retaining exclusive investigate, resolve, and reopen controls.
- The shared review-status policy is unit-tested; focused access/feedback tests passed (7 tests), TypeScript passed, targeted lint passed, and the production build passed.
- Supabase migration 20260814223000 applied successfully; the existing code-map warning remains unrelated and non-blocking.

## Completed milestone - Beta Cohort Dashboard and Release Candidate Gate

- The owner command center aggregates invitations, enrollments, release decisions, allowed access, tester reports, reply state, test-again cycles, workflow completion, export readiness, and integrity incidents.
- Musicians are derived into invited, enrolled, released, actively testing, blocked, and completed states from durable evidence rather than editable labels.
- Each tester row shows acknowledgement and environment readiness, release status, allowed access count, report count, unresolved severity, reply requirements, and completed test-again cycles.
- The release-candidate gate requires an owner-selected minimum number of completed testers, no unresolved major or blocking reports, no integrity blockers, a complete workflow, and a verified export.
- Every candidate evaluation stores the complete evidence snapshot and a SHA-256 receipt checksum in an owner-scoped table.
- Focused beta tests passed (10 tests), TypeScript passed, targeted lint passed, and Supabase migration 20260814233000 applied successfully.

## Next milestone - Secure Beta Audition and Read-Only Transport

1. Let the owner select a verified mix or export artifact as the beta audition source without exposing private source lanes.
2. Authorize released testers through the existing transport-read capability and issue short-lived, narrowly scoped playback access.
3. Keep edit, upload, destructive transport, and download operations denied unless a future explicit owner grant is added.
4. Preserve audition-start, playback-complete, failure, and feedback-checkpoint evidence in checksum-protected receipts.
5. Add the collaborator audition controls, focused tests, reviewed migration, production build, commit, and push.
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
