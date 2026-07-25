import type { TimelineEngineActivationDecision } from "../timeline/TimelineEngineActivationGate";
import type { TimelineEngineActivationSnapshot } from "../timeline/TimelineEngineActivationService";

export type TimelineActivationAuditStatus =
  TimelineEngineActivationDecision["status"];

export type TimelineActivationAuditEntry = {
  id: string;
  workflowId: string;
  status: TimelineActivationAuditStatus;
  registryFingerprint: string;
  ready: boolean;
  healthy: number;
  required: number;
  reasons: string[];
  requestedAt: string;
  expiresAt: string;
  completedAt: string | null;
};

export type TimelineActivationAuditReport = {
  summary: Omit<TimelineEngineActivationSnapshot, "decisions">;
  entries: TimelineActivationAuditEntry[];
};

export function buildTimelineActivationAudit(
  snapshot: TimelineEngineActivationSnapshot,
  filters: { workflowId?: string; status?: string } = {},
): TimelineActivationAuditReport {
  const workflowId = filters.workflowId?.trim();
  const status = filters.status?.trim();
  const entries = snapshot.decisions
    .filter((decision) => !workflowId || decision.workflowId === workflowId)
    .filter((decision) => !status || decision.status === status)
    .map((decision): TimelineActivationAuditEntry => ({
      id: decision.id,
      workflowId: decision.workflowId,
      status: decision.status,
      registryFingerprint: decision.registryFingerprint,
      ready: decision.readiness.ready,
      healthy: decision.readiness.healthy,
      required: decision.readiness.required,
      reasons: [...decision.reasons],
      requestedAt: decision.requestedAt,
      expiresAt: decision.expiresAt,
      completedAt:
        decision.consumedAt ?? decision.revokedAt ??
        (decision.status === "expired" ? decision.expiresAt : null),
    }))
    .reverse();

  const { decisions: _decisions, ...summary } = snapshot;
  return { summary, entries };
}
