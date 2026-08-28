import { describe, expect, it } from "vitest";
import { assessTimelineDawBrowserTiming } from "../../lib/timeline/TimelineDawBrowserTimingDiagnostics";

describe("timeline DAW browser timing diagnostics", () => {
  it("passes stable browser scheduling and reports exact statistics", () => {
    const report = assessTimelineDawBrowserTiming([
      0, 1, 1, 2, 2, 2, 3, 3, 4, 4,
      4, 5, 5, 6, 6, 7, 8, 9, 10, 11,
    ]);
    expect(report).toEqual({
      status: "pass",
      sampleCount: 20,
      averageJitterMs: 4.65,
      p95JitterMs: 10,
      worstJitterMs: 11,
      summary: "Browser scheduling stayed inside the DAW timing self-test limits.",
    });
  });

  it("holds timing with high p95 or worst-case jitter for review", () => {
    const report = assessTimelineDawBrowserTiming([
      1, 1, 2, 2, 3, 3, 4, 4, 5, 5,
      6, 6, 7, 7, 8, 8, 9, 15, 20, 31,
    ]);
    expect(report.status).toBe("review");
    expect(report.p95JitterMs).toBe(20);
    expect(report.worstJitterMs).toBe(31);
    expect(report.summary).toMatch(/test again/i);
  });

  it("rejects insufficient and invalid evidence", () => {
    expect(() => assessTimelineDawBrowserTiming([1, 2, 3])).toThrow(/10 timing samples/i);
    expect(() => assessTimelineDawBrowserTiming([
      1, 2, 3, 4, 5, 6, 7, 8, 9, Number.NaN,
    ])).toThrow(/finite non-negative/i);
  });
});
