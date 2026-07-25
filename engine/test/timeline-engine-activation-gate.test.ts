import { describe, expect, it } from "vitest";

import { TimelineEngineActivationGate } from "../../lib/timeline/TimelineEngineActivationGate";
import {
  TimelineEngineRegistry,
  type TimelineEngineDescriptor,
} from "../../lib/timeline/TimelineEngineRegistry";

function descriptor(id: string, dependencies: string[] = []): TimelineEngineDescriptor {
  return {
    id,
    name: id,
    module: `./${id}`,
    version: "1.0.0",
    domain: "core",
    capabilities: [id],
    dependencies,
    required: true,
  };
}

function healthyRegistry(now = "2026-07-25T12:00:00.000Z") {
  const registry = new TimelineEngineRegistry(
    [descriptor("validation"), descriptor("coordinator", ["validation"])],
    () => new Date(now),
  );
  registry.probeAll(() => ({ healthy: true, message: "focused tests green" }));
  return registry;
}

describe("TimelineEngineActivationGate", () => {
  it("issues and consumes one authorization from a healthy dependency graph", () => {
    const registry = healthyRegistry();
    const gate = new TimelineEngineActivationGate(
      registry,
      () => new Date("2026-07-25T12:01:00.000Z"),
    );
    const decision = gate.request({ workflowId: "song-1", requestedBy: "producer-1" });
    expect(decision.status).toBe("authorized");
    expect(decision.readiness.startupOrder).toEqual(["validation", "coordinator"]);
    const consumed = gate.consume({
      authorizationId: decision.id,
      workflowId: "song-1",
      consumedBy: "coordinator",
    });
    expect(consumed.status).toBe("consumed");
    expect(() => gate.consume({
      authorizationId: decision.id,
      workflowId: "song-1",
      consumedBy: "coordinator",
    })).toThrow("consumed");
  });

  it("holds workflows when a required engine has no healthy probe", () => {
    const registry = new TimelineEngineRegistry([descriptor("validation")]);
    const gate = new TimelineEngineActivationGate(registry);
    const decision = gate.request({ workflowId: "song-2", requestedBy: "producer-1" });
    expect(decision.status).toBe("blocked");
    expect(decision.reasons.join(" ")).toContain("no health probe");
    expect(() => gate.consume({
      authorizationId: decision.id,
      workflowId: "song-2",
      consumedBy: "coordinator",
    })).toThrow("blocked");
  });

  it("rejects another workflow and expires unused authorizations", () => {
    const registry = healthyRegistry();
    let time = new Date("2026-07-25T12:00:00.000Z");
    const gate = new TimelineEngineActivationGate(registry, () => time, 1_000);
    const decision = gate.request({ workflowId: "song-3", requestedBy: "producer-1" });
    expect(() => gate.consume({
      authorizationId: decision.id,
      workflowId: "song-other",
      consumedBy: "coordinator",
    })).toThrow("different workflow");
    time = new Date("2026-07-25T12:00:02.000Z");
    expect(() => gate.consume({
      authorizationId: decision.id,
      workflowId: "song-3",
      consumedBy: "coordinator",
    })).toThrow("expired");
    expect(gate.getDecision(decision.id)?.status).toBe("expired");
  });

  it("revokes stale evidence when readiness changes after authorization", () => {
    const registry = healthyRegistry();
    const gate = new TimelineEngineActivationGate(registry);
    const decision = gate.request({ workflowId: "song-4", requestedBy: "producer-1" });
    registry.recordProbe({
      engineId: "validation",
      healthy: false,
      checkedAt: "2026-07-25T12:02:00.000Z",
      version: "1.0.0",
      message: "validation regression",
    });
    expect(() => gate.consume({
      authorizationId: decision.id,
      workflowId: "song-4",
      consumedBy: "coordinator",
    })).toThrow("readiness changed");
    expect(gate.getDecision(decision.id)?.status).toBe("revoked");
  });

  it("restores evidence while preserving stable identity sequences", () => {
    const registry = healthyRegistry();
    const source = new TimelineEngineActivationGate(registry);
    const first = source.request({ workflowId: "song-5", requestedBy: "producer-1" });
    const restored = new TimelineEngineActivationGate(registry);
    restored.restoreArchive(source.exportArchive());
    expect(restored.getDecision(first.id)).toEqual(first);
    expect(restored.request({ workflowId: "song-6", requestedBy: "producer-1" }).id)
      .toBe("timeline-engine-activation-2");
  });
});
