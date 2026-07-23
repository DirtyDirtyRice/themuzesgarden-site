import { describe, expect, it } from "vitest";

import { TIMELINE_WORKSPACE } from "../../lib/timeline/TimelineSeed";
import { TimelineDiagnosticsEngine } from "../../lib/timeline/TimelineDiagnosticsEngine";
import { TimelineValidationEngine } from "../../lib/timeline/TimelineValidationEngine";

describe("TimelineDiagnosticsEngine", () => {
  it("reports a healthy workspace when its contracts and statistics agree", () => {
    const diagnostics = new TimelineDiagnosticsEngine();
    const workspace = { ...TIMELINE_WORKSPACE, events: [], statistics: { ...TIMELINE_WORKSPACE.statistics, totalEvents: 0 } };
    const validation = new TimelineValidationEngine().validateWorkspace(workspace);
    const report = diagnostics.diagnose({
      workspace,
      validation,
    });

    expect(report.health).toBe("healthy");
    expect(report.score).toBe(100);
    expect(report.findings).toHaveLength(0);
  });

  it("combines validation, graph, history, statistics, and performance failures", () => {
    const diagnostics = new TimelineDiagnosticsEngine();
    const validation = new TimelineValidationEngine().validateWorkspace({
      ...TIMELINE_WORKSPACE,
      selection: { selectedEventIds: ["missing-event"] },
    });
    const report = diagnostics.diagnose({
      workspace: {
        ...TIMELINE_WORKSPACE,
        statistics: { ...TIMELINE_WORKSPACE.statistics, totalEvents: 99 },
      },
      validation,
      relationships: {
        generatedAt: new Date().toISOString(),
        nodes: 2,
        edges: 2,
        orphanEvents: ["orphan"],
        cycles: [["a", "b", "a"]],
        issues: [],
      },
      history: {
        generatedAt: new Date().toISOString(),
        records: [],
        checkpoints: [],
        recordCount: 0,
        undoCount: 0,
        redoCount: 0,
        integrityValid: false,
      },
    });

    expect(report.health).toBe("blocked");
    expect(report.findings.map((item) => item.area)).toEqual(
      expect.arrayContaining([
        "validation",
        "relationships",
        "history",
        "statistics",
      ])
    );
  });
});
