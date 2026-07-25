import { describe, expect, it } from "vitest";
import { TimelineProductionCoordinatorEngine } from "../../lib/timeline/TimelineProductionCoordinatorEngine";

function stages() {
  return [
    { kind: "recording" as const, name: "Record", ownerId: "artist-1", dependsOn: [], dueAt: "2026-08-01T00:00:00.000Z", gates: [{ kind: "manual-check" as const, referenceId: "mic-check-1", label: "Mic check", required: true }] },
    { kind: "mixing" as const, name: "Mix", ownerId: "mixer-1", dependsOn: ["Record"], dueAt: "2026-08-05T00:00:00.000Z", gates: [{ kind: "approval" as const, referenceId: "approval-1", label: "Vocal approval", required: true }] },
    { kind: "release" as const, name: "Release", ownerId: "producer-1", dependsOn: ["Mix"], dueAt: "2026-08-10T00:00:00.000Z", gates: [{ kind: "engine-result" as const, referenceId: "rights-result-1", label: "Rights clear", required: true }] },
  ];
}

function setup() {
  const engine = new TimelineProductionCoordinatorEngine(() => new Date("2026-07-25T12:00:00.000Z"));
  const plan = engine.createPlan({ projectId: "song-1", name: "Single production", stages: stages(), createdBy: "producer-1" });
  return { engine, plan: engine.activatePlan({ planId: plan.id, activatedBy: "producer-1" }) };
}

function passStageGate(engine: TimelineProductionCoordinatorEngine, planId: string, stageId: string) {
  const plan = engine.getPlan(planId)!;
  const stage = plan.stages.find((value) => value.id === stageId)!;
  engine.decideGate({ planId, gateId: stage.gateIds[0], decision: "passed", evidenceFingerprint: `evidence-${stageId}`, decidedBy: "reviewer-1" });
}

describe("TimelineProductionCoordinatorEngine", () => {
  it("rejects unknown and cyclic dependencies", () => {
    const engine = new TimelineProductionCoordinatorEngine();
    expect(() => engine.createPlan({ projectId: "song", name: "Bad", stages: [{ ...stages()[0], dependsOn: ["Missing"] }], createdBy: "p" })).toThrow("Unknown");
    expect(() => engine.createPlan({ projectId: "song", name: "Cycle", stages: [{ ...stages()[0], dependsOn: ["Mix"] }, { ...stages()[1], dependsOn: ["Record"] }], createdBy: "p" })).toThrow("cycle");
  });

  it("holds work until dependencies and required gates pass", () => {
    const { engine, plan } = setup();
    const record = plan.stages[0];
    const mix = plan.stages[1];
    expect(() => engine.startStage({ planId: plan.id, stageId: mix.id, startedBy: "mixer-1" })).toThrow("dependency");
    expect(() => engine.startStage({ planId: plan.id, stageId: record.id, startedBy: "artist-1" })).toThrow("gate");
    passStageGate(engine, plan.id, record.id);
    expect(engine.startStage({ planId: plan.id, stageId: record.id, startedBy: "artist-1" }).stages[0].status).toBe("active");
  });

  it("coordinates the complete path and blocks premature release", () => {
    const { engine, plan } = setup();
    expect(() => engine.authorizeRelease({ planId: plan.id, authorizedBy: "producer-1" })).toThrow("stage");
    for (const original of plan.stages) {
      passStageGate(engine, plan.id, original.id);
      engine.startStage({ planId: plan.id, stageId: original.id, startedBy: original.ownerId });
      engine.completeStage({ planId: plan.id, stageId: original.id, completionFingerprint: `complete-${original.id}`, completedBy: original.ownerId });
    }
    expect(engine.authorizeRelease({ planId: plan.id, authorizedBy: "producer-1" }).status).toBe("completed");
  });

  it("holds failures and recovers without losing evidence", () => {
    const { engine, plan } = setup();
    const stage = plan.stages[0];
    passStageGate(engine, plan.id, stage.id);
    engine.startStage({ planId: plan.id, stageId: stage.id, startedBy: stage.ownerId });
    expect(engine.failStage({ planId: plan.id, stageId: stage.id, reason: "Input dropout", reportedBy: "engineer-1" }).status).toBe("held");
    expect(engine.recoverStage({ planId: plan.id, stageId: stage.id, recoveredBy: "engineer-1" }).stages[0].status).toBe("ready");
    expect(engine.listReceipts("song-1").map((value) => value.action)).toContain("stage-failed");
  });

  it("creates non-destructive revisions and holds overdue stages", () => {
    const engine = new TimelineProductionCoordinatorEngine(() => new Date("2026-09-01T00:00:00.000Z"));
    const source = engine.createPlan({ projectId: "song-1", name: "Old", stages: stages(), createdBy: "producer-1" });
    const revised = engine.revisePlan({ planId: source.id, stages: stages(), revisedBy: "producer-1" });
    expect(revised.parentPlanId).toBe(source.id);
    engine.activatePlan({ planId: revised.id, activatedBy: "producer-1" });
    expect(engine.holdOverdueStages({ planId: revised.id, checkedBy: "coordinator-1" }).status).toBe("held");
    expect(engine.getPlan(source.id)?.status).toBe("draft");
  });

  it("restores stable production identities and continues sequences", () => {
    const { engine, plan } = setup();
    const restored = new TimelineProductionCoordinatorEngine();
    restored.restoreArchive(engine.exportArchive());
    expect(restored.getPlan(plan.id)?.stages[0].id).toBe("timeline-production-stage-1");
    const next = restored.createPlan({ projectId: "song-2", name: "Next", stages: [stages()[0]], createdBy: "producer-2" });
    expect(next.id).toBe("timeline-production-plan-2");
    expect(next.stages[0].id).toBe("timeline-production-stage-4");
  });
});
