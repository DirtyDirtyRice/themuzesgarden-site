import { describe, expect, it } from "vitest";
import { assessTimelineDawHardwareSafety } from "../../lib/timeline/TimelineDawHardwareSafetyPolicy";

describe("TimelineDawHardwareSafetyPolicy", () => {
  const confirmations = { inputGainDown: true, monitorLevelDown: true, cableConnectedBeforePowerChange: true };

  it("allows a confirmed condenser signal test but never automatic power changes", () => {
    expect(assessTimelineDawHardwareSafety({ sourceType: "condenser-microphone", phantomPower: "requested", ...confirmations })).toMatchObject({ status: "safe-to-test-signal", blockers: [], automaticPowerChangeAllowed: false, persistenceAllowed: false });
  });

  it("blocks phantom power for ribbon, instrument, line, and dynamic workflows", () => {
    for (const sourceType of ["ribbon-microphone", "instrument", "line-level", "dynamic-microphone"]) {
      expect(assessTimelineDawHardwareSafety({ sourceType, phantomPower: "requested", ...confirmations })).toMatchObject({ status: "blocked", blockers: [expect.stringMatching(/phantom power/i)] });
    }
  });

  it("blocks every missing physical safety confirmation", () => {
    const report = assessTimelineDawHardwareSafety({ sourceType: "dynamic-microphone", phantomPower: "off", inputGainDown: false, monitorLevelDown: false, cableConnectedBeforePowerChange: false });
    expect(report.status).toBe("blocked");
    expect(report.blockers).toHaveLength(3);
    expect(report.warnings.join(" ")).toMatch(/Never connect.*phantom power.*Raise input gain/i);
  });
});
