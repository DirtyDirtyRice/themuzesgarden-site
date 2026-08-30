import { describe, expect, it } from "vitest";
import {
  createTimelineDawControlSurfaceQaReport,
  recordTimelineDawControlSurfaceQaTrial,
  type TimelineDawControlSurfaceQaCheck,
} from "../../lib/timeline/TimelineDawControlSurfaceQaPolicy";

describe("timeline DAW control-surface production QA policy", () => {
  it("requires identified physical hardware before accepting evidence", () => {
    const report = createTimelineDawControlSurfaceQaReport();
    expect(report.status).toBe("hardware-required");
    expect(() => recordTimelineDawControlSurfaceQaTrial({ report, check: "start", outcome: "pass", note: "Played" })).toThrow(/physical MIDI/i);
  });

  it("requires three successful physical trials for every production check", () => {
    let report = createTimelineDawControlSurfaceQaReport("Acme Control 8");
    for (const check of ["start", "continue", "stop", "reconnect"] as TimelineDawControlSurfaceQaCheck[]) {
      for (let trial = 1; trial <= 3; trial += 1) {
        report = recordTimelineDawControlSurfaceQaTrial({ report, check, outcome: "pass", note: `Physical response ${trial}` });
      }
    }
    expect(report.status).toBe("passed");
    expect(report.productionEvidenceComplete).toBe(true);
    expect(report.remainingChecks).toEqual([]);
  });

  it("does not pass partial evidence", () => {
    let report = createTimelineDawControlSurfaceQaReport("Acme Control 8");
    for (let trial = 1; trial <= 3; trial += 1) {
      report = recordTimelineDawControlSurfaceQaTrial({ report, check: "start", outcome: "pass", note: `Start response ${trial}` });
    }
    expect(report.status).toBe("in-progress");
    expect(report.completedChecks).toEqual(["start"]);
    expect(report.remainingChecks).toEqual(["continue", "stop", "reconnect"]);
  });

  it("holds the report for review when any physical trial has a problem", () => {
    const report = recordTimelineDawControlSurfaceQaTrial({
      report: createTimelineDawControlSurfaceQaReport("Acme Control 8"),
      check: "stop",
      outcome: "problem",
      note: "Transport kept playing",
    });
    expect(report.status).toBe("needs-review");
    expect(report.productionEvidenceComplete).toBe(false);
  });
});
