# Developer Workspace beta handoff

## Beta objective

Determine whether a real coder can use Developer Workspace to understand, verify, and safely modify a TypeScript project without surrendering normal source-control practices or exposing private source in feedback.

## Supported beta scenarios

1. A coder beginning a new project uses the built-in project creator, establishes the first baseline, records early changes, diagnoses a deliberate error, and verifies rollback protection.
2. A coder joining an existing project registers its exact root, adopts its current state, studies dependencies and history, makes a reversible edit, and compares the result with the adoption baseline.

The detailed, numbered scripts are available inside the app at `/developer-workspace/docs`.

## Installation model

The beta is a local-first installable web application. Run this repository on the coder's computer, open `/developer-workspace` in Chrome, and use Chrome's **Install app** option when offered. Filesystem and mutation APIs intentionally reject non-local production access.

## Verification baseline

- Dedicated Developer Workspace suite: 10 test files and 25 automated checks before the beta-documentation additions.
- Full TypeScript verification and production build passed on September 6, 2026.
- The in-app beta handoff test additionally protects the two required scenarios and the local-only feedback boundary.

## Feedback package

Coders complete `/developer-workspace/beta-feedback`. Draft responses remain in that browser and can be downloaded as JSON. Testers must not include source code, secrets, environment variables, client names, or private absolute paths. If technical evidence is needed, use the app's privacy-safe support report.

## Exit criteria for Version 1.0

- At least three coders complete the new-project scenario.
- At least three coders complete the existing-project scenario on projects of different sizes.
- No unauthorized file mutation, project-root crossing, secret exposure, or failed rollback is observed.
- Installation, project registration, baseline adoption, diagnosis, and feedback can be completed without developer assistance.
- High-frequency confusion and missing-feature reports are resolved or explicitly documented.
