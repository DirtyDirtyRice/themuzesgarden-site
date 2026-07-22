import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { appendFile, mkdir, open } from "node:fs/promises";
import path from "node:path";

import type { CompletenessReport } from "./completenessContract";
import type { ImportAcceptanceReport } from "./importAcceptanceGate";

export type PreventionClassification =
  | "confirmed-compiler-error"
  | "confirmed-contract-failure"
  | "architectural-violation"
  | "predicted-risk";

export type PreventionEventKind =
  | "attempt-held"
  | "attempt-revalidated"
  | "attempt-corrected"
  | "attempt-activated"
  | "attempt-abandoned";

export type PreventionOutcome = "held" | "corrected" | "activated" | "abandoned";

export type PreventedErrorEvidence = {
  classification: PreventionClassification;
  code: string;
  message: string;
  file: string;
  line: number | null;
  column: number | null;
  source: "compiler" | "import-gate" | "completeness-contract" | "impact-analysis" | "architecture-gate";
};

export type PreventedErrorEvent = {
  id: string;
  attemptId: string;
  capsuleId: string | null;
  kind: PreventionEventKind;
  outcome: PreventionOutcome;
  occurredAt: string;
  file: string;
  candidateHash: string;
  candidateSnapshot: string | null;
  candidateSnapshotTruncated: boolean;
  evidence: PreventedErrorEvidence[];
  impactedFiles: string[];
  impactedSymbols: string[];
  note: string;
};

export type CompilerEvidenceInput = {
  code?: string | null;
  message: string;
  file?: string | null;
  line?: number | null;
  column?: number | null;
};

export type PredictedRiskInput = {
  code: string;
  message: string;
  file?: string;
  line?: number | null;
  column?: number | null;
};

export type ArchitecturalViolationInput = {
  code: string;
  message: string;
  file?: string;
  line?: number | null;
  column?: number | null;
};
export type RecordPreventedAttemptInput = {
  attemptId?: string;
  capsuleId?: string | null;
  file: string;
  candidateSource: string;
  importAcceptance?: ImportAcceptanceReport | null;
  completeness?: CompletenessReport | null;
  contractFailures?: CompilerEvidenceInput[];
  compilerDiagnostics?: CompilerEvidenceInput[];
  predictedRisks?: PredictedRiskInput[];
  architecturalViolations?: ArchitecturalViolationInput[];
  impactedFiles?: string[];
  impactedSymbols?: string[];
  note?: string;
  occurredAt?: string;
};

export type RecordPreventionOutcomeInput = {
  attemptId: string;
  capsuleId?: string | null;
  file: string;
  candidateSource: string;
  outcome: Exclude<PreventionOutcome, "held">;
  evidence?: PreventedErrorEvidence[];
  impactedFiles?: string[];
  impactedSymbols?: string[];
  note: string;
  occurredAt?: string;
};

export type PreventionLedgerSummary = {
  generatedAt: string;
  totalEvents: number;
  attempts: number;
  currentlyHeld: number;
  corrected: number;
  activated: number;
  abandoned: number;
  confirmedCompilerErrorsPrevented: number;
  confirmedContractFailures: number;
  architecturalViolations: number;
  predictedRisks: number;
  impactedFiles: number;
  impactedSymbols: number;
};

const ledgerDirectory = "code-map-reports/prevented-errors";
const ledgerFile = "events.jsonl";
const snapshotLimit = 200_000;
const eventLimit = 4_000;
const idPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]{7,100}$/;
const lockKey = "__developerWorkspacePreventedErrorLedgerLock";
const lockState = globalThis as typeof globalThis & { [lockKey]?: Promise<void> };
lockState[lockKey] ??= Promise.resolve();

function normalizedFile(value: string): string {
  const normalized = value.replaceAll("\\", "/").replace(/^\.\//, "").trim();
  if (!normalized || normalized.startsWith("/") || /^[a-zA-Z]:\//.test(normalized) || normalized.split("/").includes("..")) {
    throw new Error("Prevented-error evidence requires a safe project-relative file path.");
  }
  return normalized;
}

function validId(value: string, label: string): string {
  if (!idPattern.test(value)) throw new Error(`${label} is invalid.`);
  return value;
}

function unique(values: string[], maximum = 2_000): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].slice(0, maximum);
}

function hash(source: string): string {
  return createHash("sha256").update(source).digest("hex");
}

function redact(source: string): string {
  return source
    .replace(/\bsk-(?:proj-)?[A-Za-z0-9_-]{16,}\b/g, "[REDACTED_OPENAI_KEY]")
    .replace(/\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\b/g, "[REDACTED_TOKEN]")
    .replace(
      /((?:api[_-]?key|secret|password|token)\s*[:=]\s*["'])([^"'\r\n]+)(["'])/gi,
      "$1[REDACTED]$3"
    );
}

function snapshot(source: string): { value: string; truncated: boolean } {
  const safe = redact(source);
  return safe.length <= snapshotLimit
    ? { value: safe, truncated: false }
    : { value: safe.slice(0, snapshotLimit), truncated: true };
}

function importClassification(category: ImportAcceptanceReport["findings"][number]["category"]): PreventionClassification {
  if (category === "client-server-boundary" || category === "dependency-cycle") return "architectural-violation";
  return "confirmed-compiler-error";
}

function evidenceFromImport(report: ImportAcceptanceReport): PreventedErrorEvidence[] {
  return report.findings
    .filter((finding) => finding.severity === "error")
    .map((finding) => ({
      classification: importClassification(finding.category),
      code: finding.code,
      message: finding.message,
      file: normalizedFile(finding.file),
      line: finding.line,
      column: finding.column,
      source: "import-gate" as const,
    }));
}

function evidenceFromCompleteness(report: CompletenessReport, file: string): PreventedErrorEvidence[] {
  return report.findings.map((finding) => ({
    classification: "confirmed-contract-failure" as const,
    code: finding.code,
    message: finding.message,
    file,
    line: finding.line,
    column: finding.column,
    source: "completeness-contract" as const,
  }));
}

function evidenceFromCompiler(diagnostics: CompilerEvidenceInput[], fallbackFile: string): PreventedErrorEvidence[] {
  return diagnostics.map((diagnostic) => ({
    classification: "confirmed-compiler-error" as const,
    code: diagnostic.code?.trim() || "COMPILER_ERROR",
    message: diagnostic.message,
    file: normalizedFile(diagnostic.file || fallbackFile),
    line: diagnostic.line ?? null,
    column: diagnostic.column ?? null,
    source: "compiler" as const,
  }));
}

function evidenceFromContractFailures(failures: CompilerEvidenceInput[], fallbackFile: string): PreventedErrorEvidence[] {
  return failures.map((failure) => ({
    classification: "confirmed-contract-failure" as const,
    code: failure.code?.trim() || "CAPSULE_REQUIREMENT_FAILED",
    message: failure.message,
    file: normalizedFile(failure.file || fallbackFile),
    line: failure.line ?? null,
    column: failure.column ?? null,
    source: "completeness-contract" as const,
  }));
}

function evidenceFromPredictions(risks: PredictedRiskInput[], fallbackFile: string): PreventedErrorEvidence[] {
  return risks.map((risk) => ({
    classification: "predicted-risk" as const,
    code: risk.code,
    message: risk.message,
    file: normalizedFile(risk.file || fallbackFile),
    line: risk.line ?? null,
    column: risk.column ?? null,
    source: "impact-analysis" as const,
  }));
}

function evidenceFromArchitecturalViolations(
  violations: ArchitecturalViolationInput[],
  fallbackFile: string,
): PreventedErrorEvidence[] {
  return violations.map((violation) => ({
    classification: "architectural-violation" as const,
    code: violation.code,
    message: violation.message,
    file: normalizedFile(violation.file || fallbackFile),
    line: violation.line ?? null,
    column: violation.column ?? null,
    source: "architecture-gate" as const,
  }));
}
function deduplicateEvidence(items: PreventedErrorEvidence[]): PreventedErrorEvidence[] {
  const values = new Map<string, PreventedErrorEvidence>();
  for (const item of items) {
    const key = [item.classification, item.code, item.file, item.line, item.column, item.message].join(":");
    if (!values.has(key)) values.set(key, item);
  }
  return [...values.values()].slice(0, eventLimit);
}

function kindForOutcome(outcome: PreventionOutcome, revalidation: boolean): PreventionEventKind {
  if (outcome === "held") return revalidation ? "attempt-revalidated" : "attempt-held";
  if (outcome === "corrected") return "attempt-corrected";
  if (outcome === "activated") return "attempt-activated";
  return "attempt-abandoned";
}

async function withLedgerLock<T>(work: () => Promise<T>): Promise<T> {
  const previous = lockState[lockKey]!;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  lockState[lockKey] = previous.then(() => gate);
  await previous;
  try {
    return await work();
  } finally {
    release();
  }
}

async function appendEvent(event: PreventedErrorEvent, root: string): Promise<void> {
  await withLedgerLock(async () => {
    const directory = path.resolve(root, ledgerDirectory);
    await mkdir(directory, { recursive: true });
    await appendFile(path.join(directory, ledgerFile), `${JSON.stringify(event)}\n`, "utf8");
  });
}

export async function recordPreventedAttempt(
  input: RecordPreventedAttemptInput,
  root = process.cwd()
): Promise<PreventedErrorEvent> {
  const file = normalizedFile(input.file);
  const attemptId = input.attemptId ? validId(input.attemptId, "Attempt id") : randomUUID();
  const capsuleId = input.capsuleId ? validId(input.capsuleId, "Capsule id") : null;
  const candidate = snapshot(input.candidateSource);
  const evidence = deduplicateEvidence([
    ...(input.importAcceptance ? evidenceFromImport(input.importAcceptance) : []),
    ...(input.completeness ? evidenceFromCompleteness(input.completeness, file) : []),
    ...evidenceFromContractFailures(input.contractFailures ?? [], file),
    ...evidenceFromCompiler(input.compilerDiagnostics ?? [], file),
    ...evidenceFromPredictions(input.predictedRisks ?? [], file),
    ...evidenceFromArchitecturalViolations(input.architecturalViolations ?? [], file),
  ]);
  if (!evidence.length) throw new Error("A prevented attempt must include at least one failed validation or predicted risk.");
  const event: PreventedErrorEvent = {
    id: randomUUID(),
    attemptId,
    capsuleId,
    kind: kindForOutcome("held", Boolean(input.attemptId)),
    outcome: "held",
    occurredAt: input.occurredAt ?? new Date().toISOString(),
    file,
    candidateHash: hash(input.candidateSource),
    candidateSnapshot: candidate.value,
    candidateSnapshotTruncated: candidate.truncated,
    evidence,
    impactedFiles: unique((input.impactedFiles ?? []).map(normalizedFile)),
    impactedSymbols: unique(input.impactedSymbols ?? []),
    note: input.note?.trim() ?? "",
  };
  await appendEvent(event, root);
  return event;
}

export async function recordPreventionOutcome(
  input: RecordPreventionOutcomeInput,
  root = process.cwd()
): Promise<PreventedErrorEvent> {
  const file = normalizedFile(input.file);
  const candidate = snapshot(input.candidateSource);
  const event: PreventedErrorEvent = {
    id: randomUUID(),
    attemptId: validId(input.attemptId, "Attempt id"),
    capsuleId: input.capsuleId ? validId(input.capsuleId, "Capsule id") : null,
    kind: kindForOutcome(input.outcome, true),
    outcome: input.outcome,
    occurredAt: input.occurredAt ?? new Date().toISOString(),
    file,
    candidateHash: hash(input.candidateSource),
    candidateSnapshot: candidate.value,
    candidateSnapshotTruncated: candidate.truncated,
    evidence: deduplicateEvidence(input.evidence ?? []),
    impactedFiles: unique((input.impactedFiles ?? []).map(normalizedFile)),
    impactedSymbols: unique(input.impactedSymbols ?? []),
    note: input.note.trim(),
  };
  if (!event.note) throw new Error("A prevention outcome requires an explanatory note.");
  await appendEvent(event, root);
  return event;
}

export async function readPreventedErrorEvents(
  limit = 200,
  root = process.cwd()
): Promise<PreventedErrorEvent[]> {
  if (!Number.isInteger(limit) || limit < 1 || limit > 2_000) throw new Error("Prevented-error event limit must be between 1 and 2,000.");
  const file = path.resolve(root, ledgerDirectory, ledgerFile);
  let handle;
  try {
    handle = await open(file, "r");
    const stats = await handle.stat();
    const chunkSize = 64 * 1_024;
    let position = stats.size;
    let content = "";
    while (position > 0 && content.split("\n").length - 1 <= limit) {
      const size = Math.min(chunkSize, position);
      position -= size;
      const buffer = Buffer.allocUnsafe(size);
      await handle.read(buffer, 0, size, position);
      content = buffer.toString("utf8") + content;
    }
    return content
      .split(/\r?\n/)
      .filter(Boolean)
      .slice(-limit)
      .reverse()
      .flatMap((line) => {
        try { return [JSON.parse(line) as PreventedErrorEvent]; } catch { return []; }
      });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  } finally {
    await handle?.close();
  }
}

export function summarizePreventedErrors(events: PreventedErrorEvent[]): PreventionLedgerSummary {
  const chronological = [...events].sort((left, right) => left.occurredAt.localeCompare(right.occurredAt));
  const latestByAttempt = new Map<string, PreventedErrorEvent>();
  const evidence = new Map<string, PreventedErrorEvidence>();
  const files = new Set<string>();
  const symbols = new Set<string>();
  for (const event of chronological) {
    latestByAttempt.set(event.attemptId, event);
    files.add(event.file);
    event.impactedFiles.forEach((file) => files.add(file));
    event.impactedSymbols.forEach((symbol) => symbols.add(symbol));
    for (const item of event.evidence) {
      const key = [event.attemptId, item.classification, item.code, item.file, item.line, item.message].join(":");
      evidence.set(key, item);
    }
  }
  const latest = [...latestByAttempt.values()];
  const countOutcome = (outcome: PreventionOutcome) => latest.filter((item) => item.outcome === outcome).length;
  const countClassification = (classification: PreventionClassification) =>
    [...evidence.values()].filter((item) => item.classification === classification).length;
  return {
    generatedAt: new Date().toISOString(),
    totalEvents: events.length,
    attempts: latest.length,
    currentlyHeld: countOutcome("held"),
    corrected: countOutcome("corrected"),
    activated: countOutcome("activated"),
    abandoned: countOutcome("abandoned"),
    confirmedCompilerErrorsPrevented: countClassification("confirmed-compiler-error"),
    confirmedContractFailures: countClassification("confirmed-contract-failure"),
    architecturalViolations: countClassification("architectural-violation"),
    predictedRisks: countClassification("predicted-risk"),
    impactedFiles: files.size,
    impactedSymbols: symbols.size,
  };
}
