import "server-only";

import type { CodeCapsule, CodeCapsuleState } from "./codeCapsule";
import { listCodeCapsules } from "./codeCapsuleStore";
import { readPreventedErrorEvents, type PreventedErrorEvent } from "./preventedErrorLedger";

export type AiDriftValidationStep = { name: string; passed: boolean; evidence: string };
export type AiDriftIncident = { attemptId: string; capsuleId: string | null; title: string; file: string; firstHeldAt: string; latestOutcome: PreventedErrorEvent["outcome"]; capsuleState: CodeCapsuleState | null; unrealized: boolean; validationSteps: AiDriftValidationStep[]; failures: string[] };
export type AiDriftReport = { generatedAt: string; totalHeldAttempts: number; stillUnrealized: number; corrected: number; activated: number; abandoned: number; incidents: AiDriftIncident[] };

function latestByAttempt(events: PreventedErrorEvent[]): PreventedErrorEvent[] {
  const values = new Map<string, PreventedErrorEvent>();
  for (const event of [...events].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))) values.set(event.attemptId, event);
  return [...values.values()];
}

export function buildAiDriftReport(events: PreventedErrorEvent[], capsules: CodeCapsule[]): AiDriftReport {
  const capsulesById = new Map(capsules.map((capsule) => [capsule.id, capsule]));
  const incidents = latestByAttempt(events).map((event): AiDriftIncident => {
    const capsule = event.capsuleId ? capsulesById.get(event.capsuleId) ?? null : null;
    const evidence = event.evidence;
    const failed = (source: PreventedErrorEvent["evidence"][number]["source"]) => evidence.filter((item) => item.source === source);
    const validationSteps: AiDriftValidationStep[] = [
      { name: "Declaration and required pieces", passed: failed("completeness-contract").length === 0, evidence: failed("completeness-contract").map((item) => item.message).join("; ") || "Completeness requirements passed." },
      { name: "Imports and exports", passed: failed("import-gate").length === 0, evidence: failed("import-gate").map((item) => item.message).join("; ") || "Import acceptance passed." },
      { name: "Compiler validity", passed: failed("compiler").length === 0, evidence: failed("compiler").map((item) => item.message).join("; ") || "Compiler validation passed." },
      { name: "Architectural safety", passed: failed("architecture-gate").length === 0, evidence: failed("architecture-gate").map((item) => item.message).join("; ") || "Architecture gate passed." },
      { name: "Real activation", passed: event.outcome === "activated" || capsule?.state === "active", evidence: event.outcome === "activated" || capsule?.state === "active" ? "The candidate became active code." : "The candidate has not entered active code." },
    ];
    return {
      attemptId: event.attemptId,
      capsuleId: event.capsuleId,
      title: capsule?.title ?? event.impactedSymbols[0] ?? "Held code candidate",
      file: event.file,
      firstHeldAt: events.filter((item) => item.attemptId === event.attemptId).sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))[0]?.occurredAt ?? event.occurredAt,
      latestOutcome: event.outcome,
      capsuleState: capsule?.state ?? null,
      unrealized: event.outcome === "held" && capsule?.state !== "active",
      validationSteps,
      failures: evidence.map((item) => `${item.code}: ${item.message}`),
    };
  }).sort((a, b) => b.firstHeldAt.localeCompare(a.firstHeldAt));
  return { generatedAt: new Date().toISOString(), totalHeldAttempts: incidents.length, stillUnrealized: incidents.filter((item) => item.unrealized).length, corrected: incidents.filter((item) => item.latestOutcome === "corrected").length, activated: incidents.filter((item) => item.latestOutcome === "activated").length, abandoned: incidents.filter((item) => item.latestOutcome === "abandoned").length, incidents };
}

export async function readAiDriftReport(root = process.cwd()): Promise<AiDriftReport> {
  const [events, capsules] = await Promise.all([readPreventedErrorEvents(2_000, root), listCodeCapsules(root)]);
  return buildAiDriftReport(events, capsules);
}
