# The Muzes Garden — Project History and Vision

Last updated: July 23, 2026

## Purpose

This document preserves the important decisions, completed milestones, current
state, and long-term vision discussed in the Codex task titled:

**THE MUZES GARDEN — AI Developer Workspace Manager**

The original Codex task remains saved and pinned. This file is the durable
project-side backup that can be opened without relying on the conversation UI.

## Working agreement

- Codex manages implementation milestones autonomously.
- Work is completed in coherent, testable sections.
- Every milestone must compile and pass relevant tests.
- Production builds and the complete regression suite are run before pushing.
- Green milestones are committed and pushed to `origin/main`.
- Existing architecture is extended rather than replaced.
- Engines and reusable infrastructure take priority over temporary UI.
- The developer and Codex co-manage visible website improvements.

## AI Developer Workspace vision

The Developer Workspace is intended to become the operating system used to
build and maintain every future part of The Muzes Garden.

Major capabilities include:

- Project explorer and search
- TypeScript symbol indexing
- Definitions, imports, exports, references, and usages
- Build-error collection with exact file, line, and column locations
- Cross-reference and downstream-impact inspection
- Stable symbol identity across line shifts, renames, and file moves
- Code Event Ledger and live file watcher
- Git history import
- Safe Patch Executor
- Completeness and import acceptance gates
- Prevented Error Ledger
- Code roots and chapter-style source navigation
- Architectural health and regression risk analysis
- Project-aware AI coding assistance
- Standalone tester workflow

## Holding Bin principle

Incomplete code or Timeline events should not become active merely because
they exist.

The lifecycle is:

```text
Draft
  ↓
Incomplete
  ↓
Waiting Validation
  ↓
Validated
  ↓
Active
  ↓
Deprecated
  ↓
Archived
  ↓
Deleted
```

Missing types, unresolved imports, invalid references, incomplete event data,
and other unsafe proposals remain held. The Prevented Error Ledger records
what would have become an error without the workspace.

## Completed Timeline engines

1. TimelineEngine
2. TimelinePlaybackEngine
3. TimelineQueryEngine
4. TimelineValidationEngine
5. TimelineHistoryEngine
6. TimelineRelationshipEngine
7. TimelineDiagnosticsEngine
8. TimelineVersionEngine
9. TimelinePromptEngine
10. TimelineAIEngine
11. TimelineActionEngine
12. TimelineOrchestrationEngine
13. TimelineRecordedOrchestrationEngine
14. TimelineEventLifecycleEngine
15. TimelineAIEventIntakeEngine
16. TimelineEventDependencyEngine

## Completed Timeline infrastructure

- OpenAI transport
- Persistent workflow ledger
- Workflow restart recovery
- Project-specific workspace storage
- Secure project-owner API
- Timeline AI workspace interface
- Event Holding Bin
- Safe editing of live events
- Permanent lifecycle evidence
- AI event intake validation
- Persistent event dependencies
- Dependency-first atomic activation
- Rollback when grouped activation fails
- Readiness preview with activation order and blockers

## Recent green milestones

- `4a58c23` Fix lyric replacement editing flow
- `182f411` Show Timeline activation readiness plans
- `ecaee43` Persist Timeline activation requirements
- `d62bce9` Add dependency-aware Timeline activation
- `a740a34` Route AI events into Timeline holding
- `1dae13e` Add held AI event intake gate
- `a70312c` Persist Timeline lifecycle evidence
- `ec117cc` Add safe Timeline event editing
- `ea915a7` Connect Timeline event holding controls
- `bf39669` Add Timeline event holding lifecycle
- `99021f6` Persist project Timeline workspaces
- `3a79a69` Restore Timeline workflows after restart
- `099c563` Add Timeline AI workflow interface
- `f8cee11` Expose secure Timeline workflow API
- `271e7b9` Record Timeline orchestration automatically
- `d80525e` Add persistent Timeline workflow ledger
- `1b2875c` Add Timeline AI orchestration workflow
- `bb34b78` Add Timeline action validation engine
- `415c802` Add Timeline OpenAI transport
- `e4b62d4` Add Timeline AI execution engine
- `67c78eb` Add Timeline prompt engine
- `8002795` Add Timeline version engine
- `2c9a380` Add Timeline diagnostics engine
- `9619266` Add Timeline relationship engine
- `725dffd` Add Timeline history engine

## Current unfinished milestone

Dependency Impact Protection is partially implemented locally.

Completed locally:

- Transitive downstream dependency-impact analysis
- Lifecycle-service connection
- Authenticated API action

Still required:

- Live-event impact interface
- Impact-chain tests
- Production verification
- Commit and push

## Music library decisions

- Songs use clear private/public status.
- A project must explicitly select private or public status before saving.
- Songs in a project follow the project’s privacy status.
- Special permissions apply only to selected private projects.
- Private songs are excluded from the public Global Player.
- Owners control whether contact information is shown.
- The Library supports grouped selection and sending songs to projects.
- Public-song browsing excludes private songs.
- Lyrics support TXT, Markdown, and PDF imports.
- Existing lyrics can be opened directly, edited, and replaced.

## Hybrid AI/DAW long-term vision

Each song becomes a repository containing as many tracks, recordings, prompts,
versions, experiments, and AI operations as the work requires. Very large
projects use virtualized loading instead of loading every track simultaneously.

Artists can combine:

- Traditional DAW editing
- AI generation and transformation
- Audio and MIDI
- Analog and digital recordings
- Lyrics, notes, automation, routing, and effects
- Questions to AI about hybrid production techniques
- Complete version and provenance history

Deletion is normally recoverable:

```text
Active → Archived → Trash → Restored or Permanently Deleted
```

## AI Mixing Sound Lab vision

A sound recipe combines authorized recorded, generated, and processed sound
ingredients. Every recipe must total exactly 100 percent.

Example:

```text
Lead Guitar Recipe
├── 30% user-recorded analog guitar
├── 25% licensed amplifier capture
├── 20% generated harmonic texture
├── 15% generated room character
└── 10% user-created effects chain
    Total: 100%
```

Every ingredient requires provenance, ownership, permission, restrictions, a
creation timestamp, and a reproducible processing description. Named-artist
cloning is excluded; permitted neutral sound characteristics are used instead.

## Planned major systems

- Finish Dependency Impact Protection
- Timeline Analytics Engine
- Deprecation, archival, restoration, and replacement lifecycle
- Stable identity for renamed or moved Timeline objects
- Dependency-chain visualization
- Team review and approval roles
- Recoverable Trash Engine
- Sound Recipe Engine
- AI Mixing Sound Lab
- Rights and Provenance Engine
- Large-project performance and stress testing
- Production monitoring and recovery controls
- Standalone application packaging

## Verification baseline

At the time this history was created:

- Production build: green
- Generated application pages: 72
- Full automated test suite: 126 passing
- Remote repository: `github.com/DirtyDirtyRice/themuzesgarden-site`
- Main branch: `main`

