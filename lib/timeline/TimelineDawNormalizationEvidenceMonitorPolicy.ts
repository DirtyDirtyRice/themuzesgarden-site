import { createHash } from "node:crypto";

const hash = (value: unknown) => `sha256:${createHash("sha256").update(JSON.stringify(value)).digest("hex")}`;
export type EvidenceMonitorIssue = "healthy" | "coverage-gap" | "previous-hash" | "chain-hash" | "subject-checksum" | "chronology" | "unknown-integrity";

export function classifyTimelineDawNormalizationEvidenceIssue(input: { complete: boolean; valid: boolean; reason: string }): EvidenceMonitorIssue {
  if (!input.complete) return "coverage-gap";
  if (input.valid) return "healthy";
  const reason = input.reason.toLowerCase();
  if (reason.includes("previous hash")) return "previous-hash";
  if (reason.includes("chain hash")) return "chain-hash";
  if (reason.includes("subject checksum")) return "subject-checksum";
  if (reason.includes("chronology")) return "chronology";
  return "unknown-integrity";
}

export function createTimelineDawNormalizationMonitoringCheckpoint(input: { sessionId: string; headHash: string | null; linkCount: number; coverage: unknown; verification: unknown; issue: EvidenceMonitorIssue; observedAt: string }) {
  const body = { schema: "the-muzes-garden/normalization-evidence-monitor-checkpoint/v1", ...input };
  return { ...body, checksum: hash(body) };
}

export function createTimelineDawNormalizationRecoveryPlan(input: { checkpointChecksum: string; issue: EvidenceMonitorIssue; coveragePlanChecksum?: string | null }) {
  const actions = input.issue === "coverage-gap" ? ["backfill-missing-subjects"] : input.issue === "healthy" ? [] : ["quarantine-chain", "manual-investigation"];
  const body = { schema: "the-muzes-garden/normalization-evidence-recovery-plan/v1", checkpointChecksum: input.checkpointChecksum, issue: input.issue, coveragePlanChecksum: input.coveragePlanChecksum ?? null, actions };
  return { ...body, planChecksum: hash(body) };
}

export function assertTimelineDawNormalizationRecoveryPlan(plan: ReturnType<typeof createTimelineDawNormalizationRecoveryPlan>, checkpointChecksum: string) {
  const { planChecksum, ...body } = plan;
  if (planChecksum !== hash(body)) throw new Error("Recovery plan checksum is invalid.");
  if (plan.checkpointChecksum !== checkpointChecksum) throw new Error("Recovery plan is stale.");
  if (plan.issue !== "coverage-gap" || plan.actions.join() !== "backfill-missing-subjects") throw new Error("Integrity failures require manual investigation and cannot rewrite evidence.");
}

export function createTimelineDawNormalizationRecoveryReceipt(input: Record<string, unknown>) {
  const body = { schema: "the-muzes-garden/normalization-evidence-recovery-receipt/v1", ...input };
  return { ...body, checksum: hash(body) };
}
