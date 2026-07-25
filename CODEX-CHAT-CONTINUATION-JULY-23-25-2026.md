# The Muzes Garden — Codex Continuation

Period covered: July 23–25, 2026  
Continues after: `PROJECT-HISTORY-AND-VISION.md`  
Security note: API keys, passwords, billing details, and other secrets are intentionally excluded.

## Why this is a continuation

The earlier history document records the original Developer Workspace vision,
Holding Bin principle, first 16 Timeline engines, and the project state on July
23. This file begins after that record so the same material is not saved twice.

## Developer Workspace progress

The AI Developer Workspace advanced from a foundation into a usable internal
coding environment. Work included project indexing, symbol and relationship
inspection, build-error collection, exact source navigation, stable symbol
identity, a Code Event Ledger, live watching, Git history import, safe patches,
completeness checks, import acceptance, architectural health, impact analysis,
prevented-error evidence, and an AI-assisted tester workflow.

The central rule remains: incomplete or invalid code is held and recorded
instead of being allowed to become active. This provides evidence of errors
prevented before a production build.

## Website and library work

- Project privacy must be explicitly selected and can later be changed.
- Project songs follow the project’s private/public status.
- Special access applies only to specifically permitted private projects.
- Public Library browsing excludes private material.
- The Global Player is restricted to public songs unless the owner has
  explicitly authorized a private-workspace context.
- Library selection supports grouped titles and individual copies.
- Songs can be sent to owner-authorized projects.
- Owner contact information is displayed only with the owner’s permission.
- Project editing, Library navigation, dropdown behavior, search behavior, and
  public-song display were repaired and improved.
- Lyrics accept text, Markdown, and PDF-derived text and support replacement
  editing.
- The navigation bar was simplified and Developer Workspace tools were added
  under Tools.

## Deployment recovery

Vercel production deployment had stopped updating the public site because of
an unpaid historical invoice and a serverless `maxDuration` configuration
failure. Billing was cleared, the invalid duration was corrected, deployments
resumed, and the custom domains were verified against each new production
deployment.

Current deployment practice:

1. Run focused tests.
2. Run TypeScript.
3. Run the complete regression suite.
4. Run the production build.
5. Commit and push `origin/main`.
6. Monitor the exact Vercel deployment until Ready.
7. Confirm aliases include `themuzesgarden.com` and `www.themuzesgarden.com`.

## Expanded music-engine architecture

After the first 16 Timeline engines, the project added production-grade engines
for orchestration, lifecycle control, dependency protection, recoverable trash,
audio artifacts, recovery, song repositories, non-destructive editing,
hybrid AI/DAW work, prompt-to-track generation, mixing, automation, effect
racks, AI mix assistance, evaluation, mastering, releases, monitoring,
analytics, rights, royalties, approvals, credits, reference analysis, stem
separation, MIDI arrangement, vocal production, and performance capture.

The engine baseline immediately before the new lyric engine:

- 50 Timeline/music engines
- 70 automated test files
- 291 passing tests
- 72 generated application pages
- Production build green
- Public deployment Ready

## Hybrid AI/DAW vision clarified

A song can contain as many tracks, prompts, recordings, edits, generated
results, MIDI parts, performances, mixes, and experiments as required. Raw
assets remain immutable while revisions, comps, transformations, and processing
remain reproducible. Removed work normally enters recoverable archive/trash
states rather than disappearing.

The AI Mixing Sound Lab uses authorized source ingredients whose percentages
must total exactly 100%. Every ingredient carries ownership, permission,
provenance, restrictions, and a reproducible processing description. Named
artist cloning is excluded in favor of legally usable neutral characteristics.

## New lyric and pronunciation requirement

The requested lyric system is not a simple text field or a copy of another
music generator’s workflow. It uses language-understanding and speech concepts
to ensure that an AI singer performs the intended words.

Required behavior:

- Accept member-written lyrics.
- Interpret sentence context so same-spelling words with different meanings or
  pronunciations are not confused.
- Create or verify phoneme sequences.
- Validate the result three times: structure, contextual meaning, and phonemes.
- Hold the song whenever meaning or pronunciation remains uncertain.
- Require a human answer before held lyrics may proceed.
- Accept bracketed, non-sung performance instructions beside lyrics.
- Support instructions such as held vowels, duration in bars, crescendo timing,
  ending octave movement, notes, metadata, and reference recordings.
- Preserve every validation issue, human resolution, revision, approval, and
  activation in a permanent receipt history.

This requirement is implemented by the Timeline Lyric Pronunciation Engine in
the milestone immediately following this continuation record.

## Remaining major engines after lyric pronunciation

- Album/Set Sequencing
- Interchange/Export
- Backup/Project Sync
- Plugin/Processing Host
- Production Coordinator

Additional future layers include real speech-model adapters, dictionary and
language packs, sung-audio phoneme alignment, melody-aware syllable timing,
human review UI, and provider-independent AI singing transports.
