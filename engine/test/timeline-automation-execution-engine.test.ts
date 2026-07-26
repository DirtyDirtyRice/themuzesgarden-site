import { describe, expect, it } from "vitest";
import { TimelineAutomationExecutionEngine } from "../../lib/timeline/TimelineAutomationExecutionEngine";

const create = (engine: TimelineAutomationExecutionEngine) =>
  engine.createLane({ targetId: "device-1", parameter: "gain", minimum: 0, maximum: 1, defaultValue: 0.5, createdBy: "steve" });

describe("TimelineAutomationExecutionEngine", () => {
  it("validates and executes sample-accurate linear automation", () => {
    const engine = new TimelineAutomationExecutionEngine();
    let lane = create(engine);
    lane = engine.addPoint({ laneId: lane.id, expectedHead: lane.head, sample: 0, value: 0, editedBy: "steve" });
    lane = engine.addPoint({ laneId: lane.id, expectedHead: lane.head, sample: 100, value: 1, editedBy: "steve" });
    lane = engine.validate({ laneId: lane.id, expectedHead: lane.head, validatedBy: "steve" });
    lane = engine.activate({ laneId: lane.id, expectedHead: lane.head, activatedBy: "steve" });
    expect(engine.valueAt(lane.id, 50)).toBe(0.5);
  });

  it("executes step and smooth curves", () => {
    const step = new TimelineAutomationExecutionEngine();
    let lane = create(step);
    lane = step.addPoint({ laneId: lane.id, expectedHead: lane.head, sample: 0, value: 0, curve: "step", editedBy: "steve" });
    lane = step.addPoint({ laneId: lane.id, expectedHead: lane.head, sample: 100, value: 1, editedBy: "steve" });
    lane = step.validate({ laneId: lane.id, expectedHead: lane.head, validatedBy: "steve" });
    lane = step.activate({ laneId: lane.id, expectedHead: lane.head, activatedBy: "steve" });
    expect(step.valueAt(lane.id, 50)).toBe(0);

    const smooth = new TimelineAutomationExecutionEngine();
    let smoothLane = create(smooth);
    smoothLane = smooth.addPoint({ laneId: smoothLane.id, expectedHead: smoothLane.head, sample: 0, value: 0, curve: "smooth", editedBy: "steve" });
    smoothLane = smooth.addPoint({ laneId: smoothLane.id, expectedHead: smoothLane.head, sample: 100, value: 1, editedBy: "steve" });
    smoothLane = smooth.validate({ laneId: smoothLane.id, expectedHead: smoothLane.head, validatedBy: "steve" });
    smoothLane = smooth.activate({ laneId: smoothLane.id, expectedHead: smoothLane.head, activatedBy: "steve" });
    expect(smooth.valueAt(smoothLane.id, 25)).toBeCloseTo(0.15625);
  });

  it("holds incomplete automation and rejects invalid or duplicate points", () => {
    const engine = new TimelineAutomationExecutionEngine();
    let lane = create(engine);
    expect(() => engine.addPoint({ laneId: lane.id, expectedHead: lane.head, sample: -1, value: 2, editedBy: "steve" })).toThrow(/Invalid/);
    lane = engine.addPoint({ laneId: lane.id, expectedHead: lane.head, sample: 10, value: 0.5, editedBy: "steve" });
    expect(() => engine.addPoint({ laneId: lane.id, expectedHead: lane.head, sample: 10, value: 0.6, editedBy: "steve" })).toThrow(/Duplicate/);
    const empty = create(engine);
    const held = engine.validate({ laneId: empty.id, expectedHead: empty.head, validatedBy: "steve" });
    expect(held.status).toBe("held");
  });

  it("prevents stale heads and editing activated lanes", () => {
    const engine = new TimelineAutomationExecutionEngine();
    let lane = create(engine);
    expect(() => engine.addPoint({ laneId: lane.id, expectedHead: 4, sample: 0, value: 0, editedBy: "steve" })).toThrow(/head conflict/);
    lane = engine.addPoint({ laneId: lane.id, expectedHead: lane.head, sample: 0, value: 0, editedBy: "steve" });
    lane = engine.validate({ laneId: lane.id, expectedHead: lane.head, validatedBy: "steve" });
    lane = engine.activate({ laneId: lane.id, expectedHead: lane.head, activatedBy: "steve" });
    expect(() => engine.addPoint({ laneId: lane.id, expectedHead: lane.head, sample: 1, value: 1, editedBy: "steve" })).toThrow(/not editable/);
  });

  it("restores stable lane and point identities without sequence reuse", () => {
    const source = new TimelineAutomationExecutionEngine();
    let lane = create(source);
    lane = source.addPoint({ laneId: lane.id, expectedHead: lane.head, sample: 0, value: 0.5, editedBy: "steve" });
    const archive = source.exportArchive();
    const restored = new TimelineAutomationExecutionEngine();
    restored.restoreArchive(archive);
    expect(restored.getLane(lane.id)).toEqual(archive.lanes[0]);
    expect(create(restored).id).not.toBe(lane.id);
    expect(() => restored.restoreArchive({ lanes: [...archive.lanes, archive.lanes[0]] })).toThrow(/Duplicate/);
  });
});
