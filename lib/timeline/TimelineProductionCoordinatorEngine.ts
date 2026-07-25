import type { TimelineId, TimelineUserId } from "./TimelineTypes";
import type { TimelineEngineActivationGate } from "./TimelineEngineActivationGate";

export type TimelineProductionStageKind =
  | "writing"
  | "recording"
  | "editing"
  | "mixing"
  | "mastering"
  | "rights"
  | "delivery"
  | "release";

export type TimelineProductionGate = {
  id: TimelineId;
  kind: "artifact" | "approval" | "engine-result" | "manual-check";
  referenceId: TimelineId;
  label: string;
  required: boolean;
  status: "pending" | "passed" | "failed" | "waived";
  evidenceFingerprint?: string;
  decidedAt?: string;
  decidedBy?: TimelineUserId;
};

export type TimelineProductionStage = {
  id: TimelineId;
  kind: TimelineProductionStageKind;
  name: string;
  ownerId: TimelineUserId;
  dependencyIds: TimelineId[];
  gateIds: TimelineId[];
  status: "planned" | "ready" | "active" | "held" | "completed" | "failed" | "cancelled";
  dueAt: string;
  startedAt?: string;
  completedAt?: string;
  completionFingerprint?: string;
  issues: string[];
};

export type TimelineProductionPlan = {
  id: TimelineId;
  projectId: TimelineId;
  name: string;
  revision: number;
  parentPlanId: TimelineId | null;
  status: "draft" | "active" | "held" | "completed" | "cancelled" | "archived";
  stages: TimelineProductionStage[];
  gates: TimelineProductionGate[];
  createdAt: string;
  createdBy: TimelineUserId;
  activatedAt?: string;
  activatedBy?: TimelineUserId;
  activationAuthorizationId?: TimelineId;
  engineRegistryFingerprint?: string;
  releasedAt?: string;
  releasedBy?: TimelineUserId;
};

export type TimelineProductionReceipt = {
  id: TimelineId;
  projectId: TimelineId;
  planId: TimelineId;
  subjectId: TimelineId;
  action:
    | "plan-created"
    | "plan-revised"
    | "plan-activated"
    | "gate-decided"
    | "stage-started"
    | "stage-held"
    | "stage-failed"
    | "stage-recovered"
    | "stage-completed"
    | "release-authorized";
  message: string;
  recordedAt: string;
  recordedBy: TimelineUserId;
};

export type TimelineProductionCoordinatorArchive = {
  plans: TimelineProductionPlan[];
  receipts: TimelineProductionReceipt[];
};

type StageInput = {
  kind: TimelineProductionStageKind;
  name: string;
  ownerId: TimelineUserId;
  dependsOn: string[];
  dueAt: string;
  gates: Array<Omit<TimelineProductionGate, "id" | "status">>;
};

const clone = <T>(value: T): T => structuredClone(value);

function text(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  return normalized;
}

export class TimelineProductionCoordinatorEngine {
  private readonly plans = new Map<TimelineId, TimelineProductionPlan>();
  private readonly receipts: TimelineProductionReceipt[] = [];
  private planSequence = 0;
  private stageSequence = 0;
  private gateSequence = 0;
  private receiptSequence = 0;

  constructor(
    private readonly now: () => Date = () => new Date(),
    private readonly activationGate?: TimelineEngineActivationGate,
  ) {}

  createPlan(input: {
    projectId: TimelineId;
    name: string;
    stages: StageInput[];
    createdBy: TimelineUserId;
  }): TimelineProductionPlan {
    const planId = `timeline-production-plan-${++this.planSequence}`;
    const built = this.buildStages(input.stages);
    const value: TimelineProductionPlan = {
      id: planId,
      projectId: text(input.projectId, "Project ID"),
      name: text(input.name, "Production plan name"),
      revision: 1,
      parentPlanId: null,
      status: "draft",
      stages: built.stages,
      gates: built.gates,
      createdAt: this.now().toISOString(),
      createdBy: input.createdBy,
    };
    this.validatePlan(value);
    this.plans.set(value.id, clone(value));
    this.record(value, value.id, "plan-created", `Production plan created with ${value.stages.length} stages.`, input.createdBy);
    return clone(value);
  }

  revisePlan(input: {
    planId: TimelineId;
    stages: StageInput[];
    revisedBy: TimelineUserId;
  }): TimelineProductionPlan {
    const source = this.requirePlan(input.planId);
    if (["completed", "cancelled"].includes(source.status)) throw new Error("This production plan cannot be revised.");
    const built = this.buildStages(input.stages);
    const value: TimelineProductionPlan = {
      ...source,
      id: `timeline-production-plan-${++this.planSequence}`,
      revision: source.revision + 1,
      parentPlanId: source.id,
      status: "draft",
      stages: built.stages,
      gates: built.gates,
      createdAt: this.now().toISOString(),
      createdBy: input.revisedBy,
      activatedAt: undefined,
      activatedBy: undefined,
      activationAuthorizationId: undefined,
      engineRegistryFingerprint: undefined,
      releasedAt: undefined,
      releasedBy: undefined,
    };
    this.validatePlan(value);
    this.plans.set(value.id, clone(value));
    this.record(value, value.id, "plan-revised", `Non-destructive revision ${value.revision} created.`, input.revisedBy);
    return clone(value);
  }

  activatePlan(input: {
    planId: TimelineId;
    activatedBy: TimelineUserId;
    activationAuthorizationId?: TimelineId;
  }): TimelineProductionPlan {
    const value = this.requirePlan(input.planId);
    if (value.status !== "draft") throw new Error("Only a draft production plan can be activated.");
    const authorization = this.activationGate
      ? this.activationGate.consume({
          authorizationId: text(input.activationAuthorizationId ?? "", "Engine activation authorization"),
          workflowId: value.id,
          consumedBy: input.activatedBy,
        })
      : null;
    for (const current of this.plans.values()) {
      if (current.projectId === value.projectId && current.status === "active") {
        this.plans.set(current.id, { ...current, status: "archived" });
      }
    }
    const stages = value.stages.map((stage) => ({
      ...stage,
      status: stage.dependencyIds.length ? "planned" as const : "ready" as const,
    }));
    const active: TimelineProductionPlan = {
      ...value, status: "active", stages,
      activatedAt: this.now().toISOString(), activatedBy: input.activatedBy,
      activationAuthorizationId: authorization?.id,
      engineRegistryFingerprint: authorization?.registryFingerprint,
    };
    this.plans.set(active.id, clone(active));
    this.record(
      active,
      active.id,
      "plan-activated",
      authorization
        ? `Production coordination is active with engine authorization ${authorization.id}.`
        : "Production coordination is active.",
      input.activatedBy,
    );
    return clone(active);
  }

  decideGate(input: {
    planId: TimelineId;
    gateId: TimelineId;
    decision: "passed" | "failed" | "waived";
    evidenceFingerprint?: string;
    decidedBy: TimelineUserId;
  }): TimelineProductionPlan {
    const value = this.activePlan(input.planId);
    const gate = value.gates.find((candidate) => candidate.id === input.gateId);
    if (!gate) throw new Error(`Unknown production gate: ${input.gateId}`);
    if (gate.status !== "pending") throw new Error("Production gate already has a decision.");
    if (input.decision === "passed" && !input.evidenceFingerprint?.trim()) {
      throw new Error("Passing a production gate requires evidence.");
    }
    if (input.decision === "waived" && gate.required) {
      throw new Error("A required production gate cannot be waived.");
    }
    gate.status = input.decision;
    gate.evidenceFingerprint = input.evidenceFingerprint?.trim();
    gate.decidedAt = this.now().toISOString();
    gate.decidedBy = input.decidedBy;
    const stage = value.stages.find((candidate) => candidate.gateIds.includes(gate.id))!;
    if (input.decision === "failed") {
      stage.status = "held";
      stage.issues = [...new Set([...stage.issues, `Gate "${gate.label}" failed.`])];
      value.status = "held";
    }
    this.save(value);
    this.record(value, gate.id, "gate-decided", `${gate.label}: ${input.decision}.`, input.decidedBy);
    return clone(value);
  }

  startStage(input: { planId: TimelineId; stageId: TimelineId; startedBy: TimelineUserId }): TimelineProductionPlan {
    const value = this.activeOrHeldPlan(input.planId);
    const stage = this.stage(value, input.stageId);
    if (stage.ownerId !== input.startedBy) throw new Error("Only the assigned owner can start this stage.");
    if (!["planned", "ready", "held"].includes(stage.status)) throw new Error("This stage cannot be started.");
    const dependencies = stage.dependencyIds.map((id) => this.stage(value, id));
    if (dependencies.some((dependency) => dependency.status !== "completed")) {
      throw new Error("Every dependency must be completed first.");
    }
    const gates = stage.gateIds.map((id) => value.gates.find((gate) => gate.id === id)!);
    const blockers = gates.filter((gate) => gate.required && gate.status !== "passed");
    if (blockers.length) throw new Error("Every required gate must pass before this stage starts.");
    stage.status = "active";
    stage.startedAt = this.now().toISOString();
    stage.issues = [];
    value.status = "active";
    this.save(value);
    this.record(value, stage.id, "stage-started", `${stage.name} started.`, input.startedBy);
    return clone(value);
  }

  completeStage(input: {
    planId: TimelineId;
    stageId: TimelineId;
    completionFingerprint: string;
    completedBy: TimelineUserId;
  }): TimelineProductionPlan {
    const value = this.activePlan(input.planId);
    const stage = this.stage(value, input.stageId);
    if (stage.status !== "active") throw new Error("Only an active stage can be completed.");
    if (stage.ownerId !== input.completedBy) throw new Error("Only the assigned owner can complete this stage.");
    stage.status = "completed";
    stage.completedAt = this.now().toISOString();
    stage.completionFingerprint = text(input.completionFingerprint, "Completion fingerprint");
    for (const candidate of value.stages) {
      if (
        candidate.status === "planned" &&
        candidate.dependencyIds.every((id) => this.stage(value, id).status === "completed")
      ) candidate.status = "ready";
    }
    this.save(value);
    this.record(value, stage.id, "stage-completed", `${stage.name} completed with evidence.`, input.completedBy);
    return clone(value);
  }

  failStage(input: {
    planId: TimelineId;
    stageId: TimelineId;
    reason: string;
    reportedBy: TimelineUserId;
  }): TimelineProductionPlan {
    const value = this.activePlan(input.planId);
    const stage = this.stage(value, input.stageId);
    if (stage.status !== "active") throw new Error("Only an active stage can fail.");
    stage.status = "failed";
    stage.issues = [text(input.reason, "Failure reason")];
    value.status = "held";
    this.save(value);
    this.record(value, stage.id, "stage-failed", stage.issues[0], input.reportedBy);
    return clone(value);
  }

  recoverStage(input: { planId: TimelineId; stageId: TimelineId; recoveredBy: TimelineUserId }): TimelineProductionPlan {
    const value = this.activeOrHeldPlan(input.planId);
    const stage = this.stage(value, input.stageId);
    if (!["failed", "held"].includes(stage.status)) throw new Error("Only a failed or held stage can recover.");
    if (stage.gateIds.some((id) => value.gates.find((gate) => gate.id === id)?.status === "failed")) {
      throw new Error("Failed production gates must be replaced in a new plan revision.");
    }
    stage.status = "ready";
    stage.issues = [];
    value.status = "active";
    this.save(value);
    this.record(value, stage.id, "stage-recovered", `${stage.name} recovered and is ready.`, input.recoveredBy);
    return clone(value);
  }

  holdOverdueStages(input: { planId: TimelineId; checkedBy: TimelineUserId }): TimelineProductionPlan {
    const value = this.activePlan(input.planId);
    const now = this.now().getTime();
    for (const stage of value.stages) {
      if (!["completed", "cancelled"].includes(stage.status) && Date.parse(stage.dueAt) < now) {
        stage.status = "held";
        stage.issues = [...new Set([...stage.issues, "Stage is overdue."])];
        this.record(value, stage.id, "stage-held", `${stage.name} is overdue.`, input.checkedBy);
      }
    }
    if (value.stages.some((stage) => stage.status === "held")) value.status = "held";
    this.save(value);
    return clone(value);
  }

  authorizeRelease(input: { planId: TimelineId; authorizedBy: TimelineUserId }): TimelineProductionPlan {
    const value = this.activePlan(input.planId);
    if (value.stages.some((stage) => stage.status !== "completed")) {
      throw new Error("Every production stage must be completed before release.");
    }
    if (value.gates.some((gate) => gate.required && gate.status !== "passed")) {
      throw new Error("Every required production gate must pass before release.");
    }
    const completed: TimelineProductionPlan = {
      ...value, status: "completed", releasedAt: this.now().toISOString(), releasedBy: input.authorizedBy,
    };
    this.save(completed);
    this.record(completed, completed.id, "release-authorized", "Production completed and release authorized.", input.authorizedBy);
    return clone(completed);
  }

  getPlan(id: TimelineId): TimelineProductionPlan | null {
    const value = this.plans.get(id);
    return value ? clone(value) : null;
  }

  listReceipts(projectId?: TimelineId): TimelineProductionReceipt[] {
    return this.receipts.filter((value) => !projectId || value.projectId === projectId).map(clone);
  }

  exportArchive(): TimelineProductionCoordinatorArchive {
    return { plans: [...this.plans.values()].map(clone), receipts: this.receipts.map(clone) };
  }

  restoreArchive(archive: TimelineProductionCoordinatorArchive): void {
    this.plans.clear();
    this.receipts.length = 0;
    const ids = new Set<TimelineId>();
    for (const plan of archive.plans) {
      for (const id of [plan.id, ...plan.stages.map((value) => value.id), ...plan.gates.map((value) => value.id)]) {
        if (ids.has(id)) throw new Error("Production archive contains duplicate IDs.");
        ids.add(id);
      }
      this.validatePlan(plan);
      this.plans.set(plan.id, clone(plan));
    }
    this.receipts.push(...archive.receipts.map(clone));
    this.planSequence = this.highest(archive.plans.map((value) => value.id));
    this.stageSequence = this.highest(archive.plans.flatMap((value) => value.stages.map((stage) => stage.id)));
    this.gateSequence = this.highest(archive.plans.flatMap((value) => value.gates.map((gate) => gate.id)));
    this.receiptSequence = this.highest(archive.receipts.map((value) => value.id));
  }

  private buildStages(inputs: StageInput[]): { stages: TimelineProductionStage[]; gates: TimelineProductionGate[] } {
    if (!inputs.length) throw new Error("Production plan requires at least one stage.");
    const names = new Map<string, TimelineId>();
    const stages: TimelineProductionStage[] = inputs.map((input) => {
      const name = text(input.name, "Stage name");
      if (names.has(name.toLowerCase())) throw new Error(`Duplicate production stage "${name}".`);
      const id = `timeline-production-stage-${++this.stageSequence}`;
      names.set(name.toLowerCase(), id);
      if (Number.isNaN(Date.parse(input.dueAt))) throw new Error(`Stage "${name}" has an invalid deadline.`);
      return { id, kind: input.kind, name, ownerId: text(input.ownerId, "Stage owner"), dependencyIds: [], gateIds: [], status: "planned" as const, dueAt: input.dueAt, issues: [] };
    });
    const gates: TimelineProductionGate[] = [];
    inputs.forEach((input, index) => {
      stages[index].dependencyIds = [...new Set(input.dependsOn.map((name) => {
        const id = names.get(name.trim().toLowerCase());
        if (!id) throw new Error(`Unknown production dependency "${name}".`);
        if (id === stages[index].id) throw new Error("A stage cannot depend on itself.");
        return id;
      }))];
      for (const gate of input.gates) {
        const value: TimelineProductionGate = { ...clone(gate), id: `timeline-production-gate-${++this.gateSequence}`, referenceId: text(gate.referenceId, "Gate reference"), label: text(gate.label, "Gate label"), status: "pending" };
        gates.push(value);
        stages[index].gateIds.push(value.id);
      }
    });
    return { stages, gates };
  }

  private validatePlan(plan: TimelineProductionPlan): void {
    const ids = new Set(plan.stages.map((stage) => stage.id));
    const visit = (id: TimelineId, path: Set<TimelineId>) => {
      if (path.has(id)) throw new Error("Production stage dependencies contain a cycle.");
      const next = new Set(path).add(id);
      for (const dependency of this.stage(plan, id).dependencyIds) {
        if (!ids.has(dependency)) throw new Error("Production stage references an unknown dependency.");
        visit(dependency, next);
      }
    };
    for (const id of ids) visit(id, new Set());
    const gateIds = new Set(plan.gates.map((gate) => gate.id));
    for (const stage of plan.stages) if (stage.gateIds.some((id) => !gateIds.has(id))) throw new Error("Production stage references an unknown gate.");
  }

  private stage(plan: TimelineProductionPlan, id: TimelineId): TimelineProductionStage {
    const value = plan.stages.find((stage) => stage.id === id);
    if (!value) throw new Error(`Unknown production stage: ${id}`);
    return value;
  }

  private activePlan(id: TimelineId): TimelineProductionPlan {
    const value = this.requirePlan(id);
    if (value.status !== "active") throw new Error("Production plan must be active.");
    return value;
  }

  private activeOrHeldPlan(id: TimelineId): TimelineProductionPlan {
    const value = this.requirePlan(id);
    if (!["active", "held"].includes(value.status)) throw new Error("Production plan must be active or held.");
    return value;
  }

  private requirePlan(id: TimelineId): TimelineProductionPlan {
    const value = this.plans.get(id);
    if (!value) throw new Error(`Unknown production plan: ${id}`);
    return clone(value);
  }

  private save(value: TimelineProductionPlan): void { this.plans.set(value.id, clone(value)); }

  private record(plan: TimelineProductionPlan, subjectId: TimelineId, action: TimelineProductionReceipt["action"], message: string, recordedBy: TimelineUserId): void {
    this.receipts.push({ id: `timeline-production-receipt-${++this.receiptSequence}`, projectId: plan.projectId, planId: plan.id, subjectId, action, message, recordedAt: this.now().toISOString(), recordedBy });
  }

  private highest(ids: string[]): number {
    return ids.reduce((maximum, id) => Math.max(maximum, Number(id.match(/(\d+)$/)?.[1] ?? 0)), 0);
  }
}
