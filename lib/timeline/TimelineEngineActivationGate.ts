import type { TimelineEngineReadinessReport, TimelineEngineRegistry } from "./TimelineEngineRegistry";
import type { TimelineId, TimelineUserId } from "./TimelineTypes";

export type TimelineEngineActivationDecision = {
  id: TimelineId;
  workflowId: TimelineId;
  requestedBy: TimelineUserId;
  status: "authorized" | "blocked" | "consumed" | "expired" | "revoked";
  registryFingerprint: string;
  readiness: TimelineEngineReadinessReport;
  reasons: string[];
  requestedAt: string;
  expiresAt: string;
  consumedAt?: string;
  consumedBy?: TimelineUserId;
  revokedAt?: string;
  revokedBy?: TimelineUserId;
  revokeReason?: string;
};

export type TimelineEngineActivationArchive = {
  decisions: TimelineEngineActivationDecision[];
};

const clone = <T>(value: T): T => structuredClone(value);

function required(value: string, label: string): string {
  const clean = value.trim();
  if (!clean) throw new Error(`${label} is required.`);
  return clean;
}

function fingerprint(value: string): string {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return `engine-registry-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export class TimelineEngineActivationGate {
  private readonly decisions = new Map<TimelineId, TimelineEngineActivationDecision>();
  private sequence = 0;

  constructor(
    private readonly registry: TimelineEngineRegistry,
    private readonly now: () => Date = () => new Date(),
    private readonly authorizationLifetimeMs = 5 * 60 * 1_000,
  ) {
    if (!Number.isFinite(authorizationLifetimeMs) || authorizationLifetimeMs < 1) {
      throw new Error("Activation authorization lifetime must be positive.");
    }
  }

  request(input: {
    workflowId: TimelineId;
    requestedBy: TimelineUserId;
  }): TimelineEngineActivationDecision {
    const workflowId = required(input.workflowId, "Workflow ID");
    const requestedBy = required(input.requestedBy, "Requester");
    const readiness = this.registry.readiness();
    const requestedAt = this.now();
    const reasons = [...readiness.errors, ...readiness.warnings];
    const decision: TimelineEngineActivationDecision = {
      id: `timeline-engine-activation-${++this.sequence}`,
      workflowId,
      requestedBy,
      status: readiness.ready ? "authorized" : "blocked",
      registryFingerprint: this.registryFingerprint(),
      readiness,
      reasons: readiness.ready
        ? ["Every required engine, dependency, version, and health probe passed."]
        : reasons.length
          ? reasons
          : ["Engine registry did not reach readiness."],
      requestedAt: requestedAt.toISOString(),
      expiresAt: new Date(requestedAt.getTime() + this.authorizationLifetimeMs).toISOString(),
    };
    this.decisions.set(decision.id, clone(decision));
    return clone(decision);
  }

  consume(input: {
    authorizationId: TimelineId;
    workflowId: TimelineId;
    consumedBy: TimelineUserId;
  }): TimelineEngineActivationDecision {
    const value = this.requireDecision(input.authorizationId);
    const workflowId = required(input.workflowId, "Workflow ID");
    const consumedBy = required(input.consumedBy, "Consumer");
    if (value.workflowId !== workflowId) {
      throw new Error("Activation authorization belongs to a different workflow.");
    }
    if (value.status !== "authorized") {
      throw new Error(`Activation authorization is ${value.status}.`);
    }
    const consumedAt = this.now();
    if (Date.parse(value.expiresAt) <= consumedAt.getTime()) {
      value.status = "expired";
      this.decisions.set(value.id, clone(value));
      throw new Error("Activation authorization expired before use.");
    }
    const currentReadiness = this.registry.readiness();
    const currentFingerprint = this.registryFingerprint();
    if (!currentReadiness.ready || currentFingerprint !== value.registryFingerprint) {
      value.status = "revoked";
      value.revokedAt = consumedAt.toISOString();
      value.revokedBy = consumedBy;
      value.revokeReason = "Engine readiness changed after authorization.";
      this.decisions.set(value.id, clone(value));
      throw new Error(value.revokeReason);
    }
    value.status = "consumed";
    value.consumedAt = consumedAt.toISOString();
    value.consumedBy = consumedBy;
    this.decisions.set(value.id, clone(value));
    return clone(value);
  }

  revoke(input: {
    authorizationId: TimelineId;
    revokedBy: TimelineUserId;
    reason: string;
  }): TimelineEngineActivationDecision {
    const value = this.requireDecision(input.authorizationId);
    if (value.status !== "authorized") {
      throw new Error("Only an unused authorization can be revoked.");
    }
    value.status = "revoked";
    value.revokedAt = this.now().toISOString();
    value.revokedBy = required(input.revokedBy, "Revoking user");
    value.revokeReason = required(input.reason, "Revocation reason");
    this.decisions.set(value.id, clone(value));
    return clone(value);
  }

  getDecision(id: TimelineId): TimelineEngineActivationDecision | null {
    const value = this.decisions.get(id);
    return value ? clone(value) : null;
  }

  listDecisions(workflowId?: TimelineId): TimelineEngineActivationDecision[] {
    return [...this.decisions.values()]
      .filter((value) => !workflowId || value.workflowId === workflowId)
      .map(clone);
  }

  exportArchive(): TimelineEngineActivationArchive {
    return { decisions: this.listDecisions() };
  }

  restoreArchive(archive: TimelineEngineActivationArchive): void {
    this.decisions.clear();
    const ids = new Set<TimelineId>();
    for (const decision of archive.decisions) {
      if (ids.has(decision.id)) throw new Error(`Duplicate activation decision: ${decision.id}`);
      ids.add(decision.id);
      if (Number.isNaN(Date.parse(decision.requestedAt)) || Number.isNaN(Date.parse(decision.expiresAt))) {
        throw new Error(`Activation decision ${decision.id} has an invalid timestamp.`);
      }
      this.decisions.set(decision.id, clone(decision));
    }
    this.sequence = archive.decisions.reduce(
      (maximum, value) => Math.max(maximum, Number(value.id.match(/(\d+)$/)?.[1] ?? 0)),
      0,
    );
  }

  private registryFingerprint(): string {
    const archive = this.registry.exportArchive();
    const descriptors = archive.descriptors
      .map((value) => [
        value.id,
        value.version,
        value.required ? "required" : "optional",
        [...value.dependencies].sort().join(","),
      ].join(":"))
      .sort();
    const probes = archive.probes
      .map((value) => [
        value.engineId,
        value.version,
        value.healthy ? "healthy" : "unhealthy",
        value.checkedAt,
        value.message,
      ].join(":"))
      .sort();
    return fingerprint(JSON.stringify({ descriptors, probes }));
  }

  private requireDecision(id: TimelineId): TimelineEngineActivationDecision {
    const cleanId = required(id, "Authorization ID");
    const value = this.decisions.get(cleanId);
    if (!value) throw new Error(`Unknown activation authorization: ${cleanId}`);
    return clone(value);
  }
}
