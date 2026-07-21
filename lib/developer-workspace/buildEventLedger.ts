import "server-only";

import { randomUUID } from "node:crypto";
import { appendFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import type { BuildCheckResult, BuildDiagnostic } from "./buildDiagnostics";
import type { CodeEvent } from "./codeEventLedger";

type DiagnosticSnapshot = {
  key: string;
  file: string | null;
  line: number | null;
  column: number | null;
  code: string | null;
  message: string;
  firstObservedAt: string;
  lastObservedAt: string;
};

type BuildSnapshot = {
  version: 1;
  generatedAt: string;
  checkKind: BuildCheckResult["kind"];
  diagnostics: Record<string, DiagnosticSnapshot>;
};

export type BuildLedgerUpdate = {
  generatedAt: string;
  events: CodeEvent[];
  activeDiagnostics: number;
};

const DIRECTORY = "code-map-reports/event-ledger";
const SNAPSHOT = "build-diagnostic-snapshot.json";
const EVENTS = "events.jsonl";

function diagnosticKey(diagnostic: BuildDiagnostic): string {
  return [diagnostic.file ?? "build", diagnostic.code ?? "error", diagnostic.message.trim().toLowerCase()].join(":");
}

async function previous(file: string): Promise<BuildSnapshot> {
  try {
    return JSON.parse(await readFile(file, "utf8")) as BuildSnapshot;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { version: 1, generatedAt: new Date(0).toISOString(), checkKind: "typecheck", diagnostics: {} };
    }
    throw error;
  }
}

function buildEvent(kind: "build-error-observed" | "build-error-resolved", diagnostic: DiagnosticSnapshot, occurredAt: string): CodeEvent {
  return {
    id: randomUUID(),
    kind,
    occurredAt,
    symbolKey: diagnostic.key,
    symbolName: diagnostic.code ?? "build error",
    symbolKind: "diagnostic",
    path: diagnostic.file ?? "[build process]",
    line: diagnostic.line ?? 1,
    previousPath: diagnostic.file,
    previousLine: diagnostic.line,
    details: `${kind === "build-error-observed" ? "Error first observed" : "Error resolved"}: ${diagnostic.message}`,
    origin: "live",
  };
}

export async function updateBuildEventLedger(result: BuildCheckResult, root = process.cwd()): Promise<BuildLedgerUpdate> {
  const directory = path.resolve(root, DIRECTORY);
  await mkdir(directory, { recursive: true });
  const snapshotFile = path.join(directory, SNAPSHOT);
  const eventFile = path.join(directory, EVENTS);
  const prior = await previous(snapshotFile);
  const parsedPrimaryErrors = result.diagnostics.filter((item) => item.primary && item.severity === "error");
  if (result.status !== "passed" && parsedPrimaryErrors.length === 0) {
    return { generatedAt: result.completedAt, events: [], activeDiagnostics: Object.keys(prior.diagnostics).length };
  }
  const occurredAt = result.completedAt;
  const current: Record<string, DiagnosticSnapshot> = {};
  const events: CodeEvent[] = [];

  for (const diagnostic of parsedPrimaryErrors) {
    const key = diagnosticKey(diagnostic);
    const old = prior.diagnostics[key];
    const snapshot: DiagnosticSnapshot = {
      key,
      file: diagnostic.file,
      line: diagnostic.line,
      column: diagnostic.column,
      code: diagnostic.code,
      message: diagnostic.message,
      firstObservedAt: old?.firstObservedAt ?? occurredAt,
      lastObservedAt: occurredAt,
    };
    current[key] = snapshot;
    if (!old) events.push(buildEvent("build-error-observed", snapshot, occurredAt));
  }

  for (const diagnostic of Object.values(prior.diagnostics)) {
    if (!current[diagnostic.key]) events.push(buildEvent("build-error-resolved", diagnostic, occurredAt));
  }

  if (events.length) {
    await appendFile(eventFile, `${events.map((item) => JSON.stringify(item)).join("\n")}\n`, "utf8");
  }

  const next: BuildSnapshot = {
    version: 1,
    generatedAt: occurredAt,
    checkKind: result.kind,
    diagnostics: current,
  };
  const temporary = `${snapshotFile}.${randomUUID()}.tmp`;
  await writeFile(temporary, JSON.stringify(next, null, 2), "utf8");
  await rename(temporary, snapshotFile);
  return { generatedAt: occurredAt, events, activeDiagnostics: Object.keys(current).length };
}
