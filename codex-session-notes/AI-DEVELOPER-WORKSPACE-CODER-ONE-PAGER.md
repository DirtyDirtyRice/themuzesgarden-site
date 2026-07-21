# AI Developer Workspace

## A safer, faster way to understand and evolve large codebases

The AI Developer Workspace is a local development environment for TypeScript and Next.js projects. It continuously maps code, follows relationships, validates proposed changes, and helps developers find the origin and impact of errors without manually searching through thousands of lines.

## What It Does

### Project Explorer

Browse folders and files, search the project, and open exact source locations from analysis results.

### Symbol Index

Indexes classes, interfaces, types, enums, functions, exported constants, and methods with their exact files and line numbers.

### Stable Symbol Identity

Recognizes the same symbol after lines shift, names change, or files move, preserving its history instead of treating it as unrelated new code.

### Cross-References and Dependency Impact

Shows where a symbol is defined, imported, exported, referenced, and used. It also follows direct and transitive dependencies to estimate the downstream effect of a change.

### Build Error Workspace

Runs TypeScript and production build checks, collects compiler errors, and opens the exact file, line, and column connected to each diagnostic.

### Temporal Error Investigation

Uses live events and Git history to trace a problem backward toward the change, symbol, relationship, or build event most likely connected to its origin.

### Code Holding Bin

Keeps proposed or incomplete code outside the active application until it has passed validation. Unfinished code cannot silently enter the live project.

### Import Acceptance Gate

Validates module paths, exported names, import forms, type-versus-runtime usage, client/server boundaries, and dependency cycles before accepting new imports.

### Completeness Contracts

Checks whether code has every piece required to become usable—not merely valid syntax. Contracts can require declarations, exports, imports, methods, calls, inheritance, and companion symbols.

### Prevented Error Ledger

Preserves evidence of failures stopped before activation, separating confirmed compiler errors, contract failures, architectural violations, and predicted risks.

### Safe Patch Executor

Applies validated changes only when the expected source still matches. It serializes modifications, runs verification, and rolls back changes that fail.

### Verification Coordinator

Queues typechecks, builds, and safe patches so competing operations cannot damage one another. Results are retained in durable verification history.

### Live Code Event Ledger

Records when symbols and relationships are observed, changed, moved, renamed, removed, or restored while developers work.

### Git History Importer

Reconstructs earlier symbol and relationship events from repository history, providing context from before the workspace began watching the project.

### AI Project Assistant

Uses the indexed project context to investigate code and errors without requiring developers to copy and paste entire files into a conversation.

## How It Is Validated

Every engine is tested against both valid and deliberately broken code. Focused tests prove that correct code is accepted while syntax errors, missing pieces, invalid imports, dependency cycles, unsafe patches, and other realistic failures are held before activation.

Concurrency tests protect simultaneous operations, security tests verify secret redaction, and source hashes prevent stale changes from being applied. Completed milestones receive a full TypeScript check, test-suite run, and production Next.js build. Before private alpha release, validation will expand to unfamiliar external projects, large files, interrupted operations, project isolation, and recovery scenarios.

## Current Stage

The core engines are working inside a large production TypeScript/Next.js project. The next release stage connects the newest validation engines throughout the interface, adds isolated external-project support, and packages the workspace for private alpha testing.

## What We Want Testers to Evaluate

- How quickly the workspace explains unfamiliar code.
- Whether import and completeness gates catch realistic mistakes.
- Whether dependency-impact results match developer expectations.
- Whether prevented-error evidence is clear and trustworthy.
- Whether the holding-bin workflow improves safety without slowing development.
- Which project structures, frameworks, or coding patterns need additional support.

## Product Direction

The long-term goal is a development operating system that remembers how code evolved, prevents incomplete changes from becoming active, explains why failures occurred, and predicts maintenance risks before they become expensive regressions.
