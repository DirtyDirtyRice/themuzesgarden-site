# Developer Workspace beta handoff

## Beta objective

Determine whether a real coder can use Developer Workspace to understand, verify, and safely modify a TypeScript project without surrendering normal source-control practices or exposing private source in feedback.

## Supported beta scenarios

1. A coder beginning a new project uses the built-in project creator, establishes the first baseline, records early changes, diagnoses a deliberate error, and verifies rollback protection.
2. A coder joining an existing project registers its exact root, adopts its current state, studies dependencies and history, makes a reversible edit, and compares the result with the adoption baseline.

The detailed, numbered scripts are available inside the app at `/developer-workspace/docs`.

## Installation model

The beta is distributed as a self-contained Windows folder. Run `npm run workspace:package` on the release machine, give the resulting `developer-workspace-beta` folder to the tester, and have the tester double-click **Start Developer Workspace.cmd**. The package carries its own Node runtime, chooses an available loopback port, and opens Chrome in app mode. Filesystem and mutation APIs continue to reject non-loopback access.

## Verification baseline

- Dedicated Developer Workspace suite: 12 test files and 43 automated checks, including the generated-declaration usage gate and direct Safe Patch bypass protection.
- Full TypeScript verification and production build passed on September 6, 2026.
- The in-app beta handoff test additionally protects the two required scenarios and the local-only feedback boundary.

## Bounded existing-project scanning correction (September 8, 2026)

- Live Project Explorer and Root Signatures now exclude dependency, generated-output, report, repository-internal, and `.codex-deploy-*` deployment-copy directories.
- Project indexing has independent file, directory, and elapsed-time limits. Reaching one returns a completed partial index with its exact truncation reason instead of leaving the interface on **Scanning...**.
- Both scanner panels stop their browser request after 45 seconds and display recovery guidance if the local server does not answer.
- Focused regression coverage verifies deployment-copy exclusion and clean file- and directory-limit termination.

## Human-controlled declaration threshold

Every newly generated type, interface, enum, class, function, or constant stays unrealized inside its inactive capsule until validation proves a real usage relationship. If an unused declaration is deliberately being kept for future work, a human developer must approve an **intentionally reserved** designation with the exact declaration name, kind, reason, and timestamp. AI cannot grant this exception, and reservation approval does not replace the separate human activation confirmation.

## Feedback package

Coders complete `/developer-workspace/beta-feedback`. Draft responses remain in that browser and can be downloaded as JSON. Testers must not include source code, secrets, environment variables, client names, or private absolute paths. If technical evidence is needed, use the app's privacy-safe support report.

## Exit criteria for Version 1.0

- At least three coders complete the new-project scenario.
- At least three coders complete the existing-project scenario on projects of different sizes.
- No unauthorized file mutation, project-root crossing, secret exposure, or failed rollback is observed.
- Installation, project registration, baseline adoption, diagnosis, and feedback can be completed without developer assistance.
- High-frequency confusion and missing-feature reports are resolved or explicitly documented.
