# The Muzes Garden DAW - Development Status

Last updated: August 15, 2026

## Current objective

Build a credible professional DAW that musicians can use in a closed beta, while preserving the original AI-assisted and historical-ledger vision. Work proceeds by complete milestones: implementation, focused tests, production build, commit, push, and this status update.

## Latest completed milestone - Recent Session Action Consolidation

- A single shared policy now selects exactly one primary action for every open recent session: Validate, Initialize Transport, Activate Session, Resume Session, or Enter Studio.
- Selection preserves the full state-machine, engine-readiness, durable-transport, and closed-session safeguards established by the preceding milestones.
- Global DAW cards no longer show a separate Enter Workspace link beside a more urgent setup or lifecycle action.
- Project cards place only the selected musician action in the primary action row.
- Suspend and Close remain available only in a clearly separated Session Lifecycle area on owner project cards.
- Closed sessions remain absent from both recent-session surfaces and never receive a primary action.
- Focused Song Start and session-coordinator tests passed (15 tests), TypeScript passed, targeted lint passed, and the production build passed with 75 generated pages.
- No database migration was required; the existing Code Map broad-pattern warning remains unrelated and non-blocking.

## Previously completed milestone - One-Action Suspended Session Resume

- Readiness-valid suspended sessions with durable transport now expose Resume Session on both global and project Song Start cards.
- Resume eligibility is centralized in the shared Song Start policy and requires state `suspended`, passing engine readiness, and valid transport context.
- The action uses the existing state-machine command with exact expected session and workspace revisions.
- Authoritative session state is reloaded after success and after conflicts or other failures.
- Draft, ready, active, held, closed, and transport-incomplete sessions never receive the resume action.
- Project cards no longer duplicate the generic Resume control alongside the musician-readable one-action path.
- Focused Song Start and session-coordinator tests passed (14 tests), TypeScript passed, targeted lint passed, and the production build passed with 75 generated pages.
- No database migration was required; the existing Code Map broad-pattern warning remains unrelated and non-blocking.

## Previously completed milestone - One-Action Session Activation

- Fully validated ready sessions with valid durable transport now expose Activate Session on both global and project Song Start cards.
- Activation eligibility is centralized in the shared Song Start policy and requires state `ready`, passing engine readiness, and valid transport context.
- The action uses the existing state-machine command with exact expected session and workspace revisions.
- Authoritative session state is reloaded after success and after conflicts or other failures.
- Draft, held, active, suspended, closed, and transport-incomplete sessions never receive the action.
- Project cards no longer duplicate the generic Activate control alongside the musician-readable one-action path.
- Focused Song Start and session-coordinator tests passed (13 tests), TypeScript passed, targeted lint passed, and the production build passed with 75 generated pages.
- No database migration was required; the existing Code Map broad-pattern warning remains unrelated and non-blocking.

## Previously completed milestone - One-Action Transport Initialization

- Engine-ready sessions without valid durable transport context now expose Initialize Transport on both global and project Song Start cards.
- Eligibility is derived from the same shared recent-session health policy, so held engines and sessions with an existing valid transport never receive the action.
- Initialization uses the existing revision-safe transport API with the exact current workspace revision.
- Authoritative workspace and transport context are reloaded after success and after any conflict or failure.
- The operation creates only the durable stopped transport baseline; it never auto-plays, auto-records, or fabricates a prior playhead.
- Focused Song Start and transport tests passed (24 tests), TypeScript passed, targeted lint passed, and the production build passed with 75 generated pages.
- No database migration was required; the existing Code Map broad-pattern warning remains unrelated and non-blocking.

## Previously completed milestone - One-Action Session Readiness Repair

- Held draft sessions now expose Run Engine Validation directly from both global and project Song Start cards.
- The action uses the existing revision-safe workspace command with the exact current session revision and workspace revision.
- Authoritative project/session readiness is reloaded after success and after any failure, including revision conflicts.
- Validation is offered only when the state machine permits it; non-draft held sessions direct the musician to review blockers inside Studio.
- The repair never auto-activates a session, starts transport, records audio, or suppresses a blocking engine result.
- Project cards no longer duplicate the generic Validate control alongside the musician-readable repair action.
- Focused Song Start and workspace-service tests passed (12 tests), TypeScript passed, targeted lint passed, and the production build passed with 75 generated pages.
- No database migration was required; the existing Code Map broad-pattern warning remains unrelated and non-blocking.

## Previously completed milestone - Recent Session Health at Song Start

- Every open session on the global and project Song Start surfaces now combines real engine readiness with validated durable transport context.
- Ready sessions show their saved bar/beat and whether they are ready to continue or resume.
- Engine-held sessions show one concrete Validate action before recording or playback rather than appearing healthy from recency alone.
- Engine-ready sessions without a valid transport record show one concrete initialization action and never fabricate a saved playhead.
- Closed sessions are excluded consistently from recommendations and project lists.
- The deterministic recommendation rule remains unchanged: prefer the active session, then the most recently updated open session.
- Focused Song Start policy tests passed (6 tests), TypeScript passed, targeted lint passed, and the production build passed with 75 generated pages.
- No database migration was required; the existing Code Map broad-pattern warning remains unrelated and non-blocking.

## Previously completed milestone - Session Save Health

- The Studio exit control now distinguishes Saved, Saving, Save State Needs Checking, and Newer Changes Found rather than implying every browser state is durable.
- Revision-safe session commands enter Saving before the request and become Saved only after the authoritative workspace revision returns.
- HTTP 409 revision conflicts receive a dedicated conflict state; other failed workspace requests are marked stale.
- Exit is disabled unless workspace state is confirmed saved, preventing a failed or conflicted request from being presented as safely persisted.
- Stale and conflicted states offer one authoritative refresh action without automatically overwriting the musician's current view.
- Refresh remains disabled while browser-local recording or take upload is active, preserving the Safe Studio Exit protections.
- Focused save-health and safe-exit tests passed (4 tests), TypeScript passed, targeted lint passed, and the production build passed with 75 generated pages.
- No database migration was required; the existing Code Map broad-pattern warning remains unrelated and non-blocking.

## Previously completed milestone - Safe Studio Exit and Return

- Studio now has one explicit Save State and Return action that reports the current authoritative durable workspace revision before exit.
- The recording workspace publishes privacy-safe local activity state for active capture and take upload without exposing audio buffers or file data.
- In-app exit is blocked while recording or while a recorded take is still being persisted, with one concrete instruction for resolving the hold.
- Closing or reloading the browser during those same local-only operations triggers the browser's native unsaved-work warning.
- The redundant unguarded project-back link was removed from the active Studio navigation so it cannot bypass the safety decision.
- A clean exit returns to the existing project Song Start and Resume surface; transport and Studio focus continue to restore independently from their authoritative state.
- Focused safe-exit and focus-restore tests passed (4 tests), TypeScript passed, targeted lint passed, and the production build passed with 75 generated pages.
- No database migration was required; the existing Code Map broad-pattern warning remains unrelated and non-blocking.

## Previously completed milestone - Studio Focus Restore

- The Studio now tracks eight stable high-level work areas: guide, beta workflow, transport, mastering, mix, recording, recovery, and export.
- A sticky focus control shows the musician's last visible area and returns there explicitly without changing playback or transport state.
- Focus state is browser-local, scoped to the exact session, and stores only an allowlisted area ID—never audio, track names, notes, storage paths, or private session content.
- Stale, malformed, and invented area values are rejected and fall back safely to normal Studio entry.
- Stable scroll anchors keep restoration independent from the internal layout of each existing DAW tool.
- Focused focus-restore and Song Start tests passed (7 tests), TypeScript passed, targeted lint passed, and the production build passed with 75 generated pages.
- No database migration was required; the existing Code Map broad-pattern warning remains unrelated and non-blocking.

## Previously completed milestone - Durable Studio Resume Context

- Owner-scoped workspace snapshots now expose a minimal resume index derived from each visible session's existing durable transport archive.
- Resume context contains only tick, sample, PPQ, and transport update time; it does not expose audio, private lanes, storage paths, or another project's sessions.
- The global DAW control center and each project Studio show the recommended session's saved playhead as a musician-readable bar and beat.
- Sessions with no valid saved transport receive an explicit song-start fallback instead of a fabricated position.
- Reopening still uses the existing Studio transport restoration path, so the displayed cue and restored playhead share one authoritative transport record.
- Focused Song Start and workspace-service tests passed (10 tests), TypeScript passed, targeted lint passed, and the production build passed with 75 generated pages.
- No database migration was required; the existing Code Map broad-pattern warning remains unrelated and non-blocking.

## Previously completed milestone - Song Start and Resume

- The authenticated DAW control center now recommends the active session across every owner project, falling back deterministically to the most recently saved open session.
- Each project Studio presents the same resume-first path, excludes closed sessions, and limits the working list to the six most recent open sessions.
- Suspended work is labeled explicitly as Resume Session; other open work uses Continue in Studio.
- Starting a linked song now supplies a musician-readable session name by default, creates the durable protected session through the existing revision-safe API, and navigates directly into its Studio workspace.
- Empty projects retain a clear first-song instruction without creating placeholder sessions or bypassing linked-song ownership.
- Focused Song Start policy tests passed (4 tests), TypeScript passed, targeted lint passed, and the production build passed with 75 generated pages.
- No database migration was required; the existing Code Map broad-pattern warning remains unrelated and non-blocking.

## Previously completed milestone - Normalization Support Evidence Chain Coverage and Backfill

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

## Completed milestone - Secure Beta Audition and Read-Only Transport

- Owners can publish exactly one active beta audition source from checksum-matching, currently approved normalization masters.
- Publishing automatically revokes the previously selected source and never exposes private source lanes, buses, edits, uploads, or project administration.
- Released musicians receive a five-minute signed playback URL only after the existing transport-read capability boundary passes live.
- The storage policy permits access only to the active selected master object for the owner or a currently active, released tester.
- The collaborator player suppresses download and playback-rate controls while clearly explaining that it is a read-only beta audition.
- Audition-opened, playback-started, playback-completed, playback-failed, and feedback-checkpoint events are stored as checksum-protected participant receipts.
- Owners can review tester identity, playback position, event type, detail, and time from the studio audition panel.
- Focused audition tests passed (6 tests), TypeScript passed, targeted lint passed, and Supabase migration 20260815003000 applied successfully.

## Completed milestone - Beta Release Packaging and Tester Operations

- Owners can pause, resume, complete, or permanently revoke individual testers with guarded state transitions and a required written reason.
- Paused, completed, and revoked states immediately fail the central active-enrollment access requirement; resuming deliberately restores eligibility for live checks.
- Every state change is atomic and preserved in immutable, checksum-protected participant-readable operation history.
- The cohort dashboard now derives paused testers as blocked and owner-completed testers as completed.
- Owners can generate a handoff package containing the exact tester entry link, environment requirements, privacy boundaries, current workflow evidence, approved audition identity, and release-candidate receipt reference.
- Every generated package, including a held package, preserves its evidence and blockers in an owner-scoped checksum receipt.
- A copyable package and downloadable plain-text compatibility summary exclude private tracks, storage paths, credentials, and protected project data.
- Focused beta tests passed (10 initial tests and 7 final integration tests), TypeScript passed, targeted lint passed, and Supabase migration 20260815013000 applied successfully.

## Completed milestone - Tester Portal and End-to-End Beta Readiness Certification

- Every signed-in musician has a private portal listing only their own redeemed beta sessions, enrollment state, acknowledgement, environment readiness, release state, and permitted entry link.
- The latest owner-generated handoff requirements, privacy boundaries, and package blockers are delivered without returning owner-only evidence, private DAW data, or another tester's identity.
- Session entry remains locked unless the tester is active and released; all real access checks still run again at the central capability boundary.
- Owners can run a seven-part audit covering enrollment, release, session authorization, published audition, complete workflow, usable feedback access, and operation enforcement.
- Every audit stores its exact checks, blockers, observed time, and deterministic SHA-256 receipt in a participant-readable certification record.
- The owner studio displays every pass or hold, while the tester portal displays only that musician's latest certification.
- Focused beta tests passed (7 tests), TypeScript passed, targeted lint passed, and the production build passed with 75 generated pages.
- Supabase migration 20260815023000 applied successfully; the existing Code Map warning remains unrelated and non-blocking.

## Completed milestone - Controlled Beta Launch Operations and Cohort Telemetry

- Owners can atomically launch all currently active, certified musicians against the exact ready release package and certification receipts.
- The database rejects inactive, uncertified, stale, mismatched, or empty launch manifests before any partial cohort can be created.
- Launches support guarded active, paused, resumed, and permanently closed lifecycle transitions with required written reasons.
- Privacy-safe telemetry derives portal entry, allowed authorization, audition completion, workflow progress, feedback activity, tester completion, and last activity from existing receipts.
- Testers inactive for 72 hours are identified as stalled with one concrete next action; no audio, storage paths, or protected diagnostics are collected.
- Launch creation and every lifecycle operation preserve checksum-protected evidence.
- Focused launch tests passed (7 tests), TypeScript passed, targeted lint passed, and the production build passed with 75 generated pages.
- Supabase migration 20260815033000 applied successfully; the existing Code Map warning remains unrelated and non-blocking.

## Completed milestone - Musician Arrangement Editing Beta Surface

- A musician can choose Full Song, Stems, or Alternate Versions and import WAV/MP3 files directly into the arrangement without manually creating version-family records or lanes.
- Full songs create one aligned finished-mix lane, stems create synchronized lanes at the same start time, and alternate versions create sequential comparison lanes.
- Import validation holds missing, empty, incompatible, or incorrectly grouped files before upload; duplicate source checks remain enforced by the durable intake API.
- Imports run with a bounded three-file concurrency limit, visible progress, safe cancellation, clear failure reporting, and automatic arrangement refresh.
- Every upload creates a protected source artifact before editable lanes are created; arrangement removal and editing never overwrite the original source audio.
- The durable private-lane editor supplies immediate transport audition, waveform positions, split-at-playhead, move, source trim, fades, automatic crossfades, gain, pan, mute, solo, group editing, restore history, snapshots, automation, buses, and protected bounce/export.
- The multitrack arrangement supplies direct region selection, playhead, ruler, zoom, horizontal scrolling, waveform regions, drag movement, trim handles, fade handles, grouped edits, mixer undo/redo, and source-preserving clip history.
- Advanced version-family tools remain available in a collapsed section while the plain-language musician import is the primary entry point.
- Focused import and private-lane tests passed (6 tests), TypeScript passed, targeted lint passed, and the production build passed with 75 generated pages.
- The existing Code Map broad-pattern warning remains unrelated and non-blocking.

## Completed milestone - Musician Effects and Mixing Beta Surface

- A compact Quick Mix surface now appears immediately after musician audio import and controls the existing durable lane, insert, send, bus-routing, monitoring, and persistence engines.
- Every imported lane exposes immediate mute, solo, gain, pan, output routing, parallel sends, and live peak/clip feedback in plain musician language.
- Clean, Vocal, Punch, and Warm starting sounds create bounded native effect chains; Clean safely bypasses the active chain rather than deleting its history.
- A/B Effects bypasses and restores the lane's persisted effects for immediate comparison without changing source audio.
- Each channel reports safe, hot, or clip state, effect latency in milliseconds, light/medium/high processing-load guidance, and one concrete recommendation.
- The Master Bus remains first in the signal path with gain, mute, undo, redo, and freeze-time peak/RMS/true-peak/clip evidence.
- Existing buses, parameter-level inserts, sidechains, delay compensation, automation, snapshots, collaboration, recovery history, freeze, and bounce remain available under one collapsed Advanced section.
- Focused mixer, bus-processing, master/PDC, and snapshot tests passed (12 tests), TypeScript passed, targeted lint passed, and the production build passed with 75 generated pages.
- The existing Code Map broad-pattern warning remains unrelated and non-blocking.

## Completed milestone - Guided First Owner-Musician Test Session

- A private owner-musician test now guides Steve through exactly seven ordered checks without pretending to be six external testers.
- Only one action is visible at a time: protect the original, import audio, audition it, make a reversible edit, make a Quick Mix decision, save a recovery snapshot, and verify an export.
- The protected-copy acknowledgement is mandatory before the test can advance.
- Import, edit, mix, recovery, and export passes are independently rejected unless their required durable DAW records exist.
- Every pass, failure, confusing result, and blocker is retained with notes, click count, excessive-step marking, automatic browser context, time, and an optional compressed screenshot.
- Test sessions and observations are private under owner-only row-level security; screenshots are never public assets.
- The UI clearly separates advanced collaboration, cohort, mastering-delivery, and unsupported device-chain testing from this first core musician path.
- Focused policy tests passed (6 tests across the new and existing guided policies), TypeScript passed, targeted lint passed, and the production build passed with 75 generated pages.
- Supabase migration 20260815043000 applied successfully; the existing Code Map broad-pattern warning remains unrelated and non-blocking.

## Completed milestone - First Guided Test Usability Repair

- Steve's first guided attempt correctly identified that the split-screen title bar could cover the Global Player header and make its Close control unreachable.
- Global Player layering now remains above the sticky title bar in narrow and split-window layouts.
- The player viewport width now uses a server-safe initial value, preventing the server/browser width mismatch that raised the hydration error.
- The test process identified excessive live-instruction cognitive load; this is recorded as a workflow design issue, not a tester failure.
- TypeScript passed and the production build passed with 75 generated pages; the existing Code Map broad-pattern warning remains unrelated and non-blocking.

## Completed milestone - Accessible Visual Musician Test Guide

- The Project Studio now includes an eight-lesson, one-picture/one-action walkthrough for opening the studio, protecting the original, importing, auditioning, editing, quick mixing, recovering, and exporting.
- Every lesson uses a stable DAW-style visual preview with a numbered yellow spotlight, the exact live control label, one short action, and one "what you should see next" statement.
- Previous and Next controls save progress in the browser so a musician can stop and resume without remembering the last step.
- Read This Aloud uses browser speech when available, and Show Live Control jumps to the matching real studio section.
- Durable project evidence is evaluated independently and displayed as verified or not yet verified; automated checks are never presented as Steve's personal listening or usability opinion.
- Optional human judgments remain short and limited to sound quality or clarity after the relevant controls are visually familiar.
- Focused visual-guide and owner-test policy tests passed (6 tests), TypeScript passed, targeted lint passed, and the production build passed with 75 generated pages.
- The existing Code Map broad-pattern warning remains unrelated and non-blocking.

## Completed milestone - Library and Global Player Read-Only Recovery

- A read-only live audit verified that all 462 MP3 files remain intact in the linked Supabase audio bucket; no audio was deleted, rewritten, or re-uploaded.
- The audit also verified 794 intact project-track rows, including 463 storage-track links and 331 database track IDs.
- The zero-song state was caused by project row-level security hiding every project from anonymous public-catalog queries, not by missing music.
- A narrow row-level security policy now exposes only project rows whose visibility is explicitly public; private and shared projects remain protected.
- Live anonymous verification now returns four public projects, 329 distinct public-project track links, and 226 matching public storage MP3s.
- The remaining 236 storage MP3s remain excluded because they are private or are not assigned to a public project.
- The Global Player still rejects private, shared, and unknown songs unless a stable track key proves membership in an explicitly public project.
- Focused Global Player privacy tests passed (5 tests), TypeScript passed, and the production build passed with 75 generated pages.
- Supabase migration 20260815053000 applied successfully; the existing Code Map broad-pattern warning remains unrelated and non-blocking.

## Completed milestone - Automated DAW Technical Test Runner

- One owner action now checks protected-copy confirmation, imported audio, reversible editing, Quick Mix activity, recovery snapshots, and completed exports against durable DAW records.
- Audition remains explicitly human-required because software cannot honestly decide whether Steve heard the right sound or found playback understandable.
- Every result is classified as verified, held, or human-required and links directly to its accessible visual-guide lesson and live studio control.
- Each run creates an owner-only Supabase receipt containing the exact evidence counts, blockers, result set, readiness state, timestamp, and SHA-256 checksum.
- The automated runner sits beside the guided manual owner-musician test rather than replacing human listening and usability observations.
- Focused technical, visual-guide, and owner-test policy tests passed, TypeScript passed, targeted lint passed, and Supabase migration 20260815063000 applied successfully.

## Completed milestone - Owner-Musician Test Report and Evidence Export

- Project Studio now combines the latest checksum-bearing technical receipt with the latest guided musician session and observations in one owner-authenticated report.
- Every workflow finding keeps automated proof and human judgment in separate panels and reports verified-together, human-check-needed, or attention-required status without inventing listening opinions.
- Notes, click counts, excessive-step flags, timestamps, blockers, and private screenshots remain attached to the exact step that produced them.
- Each finding opens its exact accessible visual lesson or live Studio control, reducing search and memory load during testing.
- The private report can be printed or downloaded as structured JSON; downloaded JSON records screenshot presence while deliberately omitting embedded private image data.
- Focused technical, visual-guide, and report policy tests passed (9 tests), TypeScript passed, and targeted lint passed.

## Back Burner - Intentionally skipped

### First Complete Owner-Musician Evidence Run

The manual evidence run is intentionally deferred. Its implementation prerequisites, automated runner, visual guide, and private report remain available; no automated result will be presented as Steve's listening or usability judgment.

## Next eligible milestone - Session Lifecycle Confirmation

1. Require explicit musician confirmation before suspending or permanently closing a session from recent-session cards.
2. Explain the exact effect of each lifecycle transition without implying that audio or source artifacts are deleted.
3. Preserve revision-safe commands and authoritative reload after every confirmed transition.
4. Verify focused policy and API behavior, then run the full production build before release.
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
