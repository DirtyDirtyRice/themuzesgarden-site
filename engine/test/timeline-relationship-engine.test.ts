import { describe, expect, it } from "vitest";

import {
  TIMELINE_SAMPLE_EVENTS,
  TIMELINE_WORKSPACE,
} from "../../lib/timeline/TimelineSeed";
import { TimelineRelationshipEngine } from "../../lib/timeline/TimelineRelationshipEngine";

function setup() {
  const engine = new TimelineRelationshipEngine();
  engine.load({
    ...TIMELINE_WORKSPACE,
    events: TIMELINE_SAMPLE_EVENTS.slice(0, 3).map((event) => ({
      ...event,
      relationships: [],
    })),
  });
  return engine;
}

describe("TimelineRelationshipEngine", () => {
  it("indexes validated links and finds shortest paths", () => {
    const engine = setup();
    engine.addRelationship("event-0001", "event-0002", "precedes");
    engine.addRelationship("event-0002", "event-0003", "inspires");

    expect(engine.findShortestPath("event-0001", "event-0003")).toEqual([
      "event-0001",
      "event-0002",
      "event-0003",
    ]);
    expect(engine.analyzeImpact("event-0003").transitiveDependents).toEqual(
      expect.arrayContaining(["event-0001", "event-0002"])
    );
  });

  it("rejects broken links and detects dependency cycles", () => {
    const engine = setup();
    expect(() =>
      engine.addRelationship("event-0001", "missing", "depends-on")
    ).toThrow("does not exist");

    engine.addRelationship("event-0001", "event-0002", "depends-on");
    engine.addRelationship("event-0002", "event-0001", "depends-on");
    expect(engine.findCycles()).toHaveLength(1);
    expect(engine.getSnapshot().issues.some((issue) => issue.code === "cycle")).toBe(
      true
    );
  });

  it("deduplicates identical links and cleans edges when removing events", () => {
    const engine = setup();
    const first = engine.addRelationship("event-0001", "event-0002", "precedes");
    const duplicate = engine.addRelationship(
      "event-0001",
      "event-0002",
      "precedes"
    );

    expect(duplicate.id).toBe(first.id);
    expect(engine.getEdges()).toHaveLength(1);
    engine.removeEvent("event-0002");
    expect(engine.getEdges()).toHaveLength(0);
  });
});
