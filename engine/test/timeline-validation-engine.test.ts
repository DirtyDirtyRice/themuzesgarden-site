import { describe, expect, it } from "vitest";

import {
  TIMELINE_SAMPLE_EVENTS,
  TIMELINE_WORKSPACE,
} from "../../lib/timeline/TimelineSeed";
import { TimelineValidationEngine } from "../../lib/timeline/TimelineValidationEngine";

describe("TimelineValidationEngine", () => {
  it("accepts a complete event that belongs to a real workspace track", () => {
    const engine = new TimelineValidationEngine();
    const event = {
      ...TIMELINE_SAMPLE_EVENTS[0],
      relationships: [],
    };

    const decision = engine.evaluateActivation(event, TIMELINE_WORKSPACE);

    expect(decision.accepted).toBe(true);
    expect(decision.lifecycle).toBe("active");
    expect(engine.getSnapshot().heldCount).toBe(0);
  });

  it("holds incomplete events and records why activation was prevented", () => {
    const engine = new TimelineValidationEngine();
    const event = {
      ...TIMELINE_SAMPLE_EVENTS[0],
      trackId: "missing-track",
      marker: "",
      title: "",
      metadata: {
        ...TIMELINE_SAMPLE_EVENTS[0].metadata,
        title: "",
      },
    };

    const decision = engine.evaluateActivation(event, TIMELINE_WORKSPACE);
    const snapshot = engine.getSnapshot();

    expect(decision.accepted).toBe(false);
    expect(decision.lifecycle).toBe("incomplete");
    expect(decision.report.detailedIssues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["unknown-track", "required", "missing-payload"])
    );
    expect(snapshot.heldCount).toBe(1);
    expect(snapshot.preventedActivationCount).toBe(1);
    expect(snapshot.heldEvents[0].attempts).toBe(1);
  });

  it("detects duplicate IDs, broken selections, and stale statistics", () => {
    const engine = new TimelineValidationEngine();
    const first = {
      ...TIMELINE_SAMPLE_EVENTS[0],
      relationships: [],
    };
    const workspace = {
      ...TIMELINE_WORKSPACE,
      events: [first, { ...first }],
      selection: {
        selectedEventIds: ["missing-event"],
      },
      statistics: {
        ...TIMELINE_WORKSPACE.statistics,
        totalEvents: 0,
      },
    };

    const report = engine.validateWorkspace(workspace);
    const codes = report.detailedIssues.map((issue) => issue.code);

    expect(report.valid).toBe(false);
    expect(codes).toContain("duplicate-id");
    expect(codes).toContain("unknown-event");
    expect(codes).toContain("statistics-mismatch");
  });
});
