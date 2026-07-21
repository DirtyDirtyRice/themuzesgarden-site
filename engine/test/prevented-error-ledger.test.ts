import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  readPreventedErrorEvents,
  recordPreventedAttempt,
  recordPreventionOutcome,
  summarizePreventedErrors,
} from "../../lib/developer-workspace/preventedErrorLedger";
import type { ImportAcceptanceReport } from "../../lib/developer-workspace/importAcceptanceGate";

const roots: string[] = [];

async function temporaryRoot(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), "prevented-error-ledger-"));
  roots.push(root);
  return root;
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

function failedImportReport(): ImportAcceptanceReport {
  return {
    file: "lib/timeline/NewRuntime.ts",
    checkedAt: "2026-07-20T10:00:00.000Z",
    accepted: false,
    importCount: 2,
    resolvedImportCount: 1,
    dependencyCycles: [["lib/timeline/NewRuntime.ts", "lib/timeline/TimelineEngine.ts", "lib/timeline/NewRuntime.ts"]],
    findings: [
      {
        category: "export-contract",
        severity: "error",
        code: "IMPORT_NAMED_NOT_EXPORTED",
        message: "TimelineEngin is not exported.",
        file: "lib/timeline/NewRuntime.ts",
        line: 1,
        column: 10,
        moduleSpecifier: "./TimelineEngine",
        importedName: "TimelineEngin",
        resolvedFile: "lib/timeline/TimelineEngine.ts",
      },
      {
        category: "dependency-cycle",
        severity: "error",
        code: "IMPORT_DEPENDENCY_CYCLE",
        message: "The candidate creates a dependency cycle.",
        file: "lib/timeline/NewRuntime.ts",
        line: 1,
        column: 1,
        moduleSpecifier: null,
        importedName: null,
        resolvedFile: null,
      },
    ],
  };
}

describe("Prevented Error Ledger", () => {
  it("stores redacted, hash-backed evidence with honest classifications", async () => {
    const root = await temporaryRoot();
    const event = await recordPreventedAttempt(
      {
        attemptId: "attempt-ledger-001",
        capsuleId: "capsule-ledger-001",
        file: "lib/timeline/NewRuntime.ts",
        candidateSource: "const apiKey = 'sk-proj-abcdefghijklmnopqrstuvwxyz123456';\nexport const broken = TimelineEngin;",
        importAcceptance: failedImportReport(),
        compilerDiagnostics: [{ code: "TS2304", message: "Cannot find name TimelineEngin.", line: 2, column: 23 }],
        predictedRisks: [{ code: "HIGH_FANOUT", message: "The proposed runtime may affect many dependents." }],
        impactedFiles: ["lib/timeline/TimelineEngine.ts"],
        impactedSymbols: ["TimelineEngine"],
        note: "Held before activation.",
        occurredAt: "2026-07-20T10:01:00.000Z",
      },
      root
    );

    expect(event.outcome).toBe("held");
    expect(event.candidateHash).toMatch(/^[a-f0-9]{64}$/);
    expect(event.candidateSnapshot).toContain("[REDACTED]");
    expect(event.candidateSnapshot).not.toContain("sk-proj-");
    expect(event.evidence.map((item) => item.classification)).toEqual(expect.arrayContaining([
      "confirmed-compiler-error",
      "architectural-violation",
      "predicted-risk",
    ]));
  });

  it("preserves the lifecycle from held through corrected and activated", async () => {
    const root = await temporaryRoot();
    const held = await recordPreventedAttempt(
      {
        attemptId: "attempt-ledger-002",
        file: "lib/timeline/NewRuntime.ts",
        candidateSource: "export const broken = Missing;",
        compilerDiagnostics: [{ code: "TS2304", message: "Cannot find name Missing." }],
        occurredAt: "2026-07-20T10:02:00.000Z",
      },
      root
    );
    await recordPreventionOutcome(
      {
        attemptId: held.attemptId,
        file: held.file,
        candidateSource: "export const ready = true;",
        outcome: "corrected",
        note: "Missing symbol was replaced and validation passed.",
        occurredAt: "2026-07-20T10:03:00.000Z",
      },
      root
    );
    await recordPreventionOutcome(
      {
        attemptId: held.attemptId,
        file: held.file,
        candidateSource: "export const ready = true;",
        outcome: "activated",
        note: "Validated correction was safely activated.",
        occurredAt: "2026-07-20T10:04:00.000Z",
      },
      root
    );

    const events = await readPreventedErrorEvents(20, root);
    const summary = summarizePreventedErrors(events);
    expect(events).toHaveLength(3);
    expect(summary.attempts).toBe(1);
    expect(summary.activated).toBe(1);
    expect(summary.currentlyHeld).toBe(0);
    expect(summary.confirmedCompilerErrorsPrevented).toBe(1);
  });

  it("serializes concurrent attempts without losing ledger lines", async () => {
    const root = await temporaryRoot();
    await Promise.all(
      Array.from({ length: 12 }, (_, index) => recordPreventedAttempt(
        {
          attemptId: `attempt-concurrent-${String(index).padStart(3, "0")}`,
          file: `lib/generated/Candidate${index}.ts`,
          candidateSource: `export const value${index} = Missing${index};`,
          compilerDiagnostics: [{ code: "TS2304", message: `Cannot find name Missing${index}.` }],
        },
        root
      ))
    );

    const events = await readPreventedErrorEvents(50, root);
    expect(events).toHaveLength(12);
    expect(new Set(events.map((event) => event.attemptId)).size).toBe(12);
    expect(summarizePreventedErrors(events).currentlyHeld).toBe(12);
  });

  it("refuses to create proof without an actual failure or risk", async () => {
    const root = await temporaryRoot();
    await expect(recordPreventedAttempt(
      {
        file: "lib/timeline/Valid.ts",
        candidateSource: "export const valid = true;",
      },
      root
    )).rejects.toThrow("at least one failed validation");
  });
});
