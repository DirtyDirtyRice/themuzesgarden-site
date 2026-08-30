import { describe, expect, it } from "vitest";
import { createTimelineDawAudioInterfaceQaReport, recordTimelineDawAudioInterfaceQaEvidence, TIMELINE_DAW_AUDIO_INTERFACE_QA_CHECKS } from "../../lib/timeline/TimelineDawAudioInterfaceQaPolicy";

describe("timeline DAW physical audio-interface QA", () => {
  it("requires a named physical interface", () => {
    const report = createTimelineDawAudioInterfaceQaReport();
    expect(report.status).toBe("hardware-required");
    expect(() => recordTimelineDawAudioInterfaceQaEvidence({ report, check: "identity", outcome: "pass", note: "Scarlett shown" })).toThrow(/identify the physical interface/i);
  });

  it("passes only after every physical check has evidence", () => {
    let report = createTimelineDawAudioInterfaceQaReport("Focusrite Scarlett 2i2");
    for (const check of TIMELINE_DAW_AUDIO_INTERFACE_QA_CHECKS) report = recordTimelineDawAudioInterfaceQaEvidence({ report, check, outcome: "pass", note: `${check} physically verified` });
    expect(report.status).toBe("passed");
    expect(report.productionEvidenceComplete).toBe(true);
    expect(report.remainingChecks).toEqual([]);
  });

  it("keeps partial evidence in progress", () => {
    const report = recordTimelineDawAudioInterfaceQaEvidence({ report: createTimelineDawAudioInterfaceQaReport("Apollo Twin"), check: "input-signal", outcome: "pass", note: "Meter moved cleanly" });
    expect(report.status).toBe("in-progress");
    expect(report.remainingChecks).toContain("output-monitoring");
  });

  it("holds any observed physical problem for review", () => {
    const report = recordTimelineDawAudioInterfaceQaEvidence({ report: createTimelineDawAudioInterfaceQaReport("Apollo Twin"), check: "reconnect", outcome: "problem", note: "Device did not return" });
    expect(report.status).toBe("needs-review");
    expect(report.productionEvidenceComplete).toBe(false);
  });
});
