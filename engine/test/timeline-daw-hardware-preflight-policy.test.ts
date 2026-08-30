import { describe, expect, it } from "vitest";
import { assessTimelineDawHardwarePreflight } from "../../lib/timeline/TimelineDawHardwarePreflightPolicy";

describe("TimelineDawHardwarePreflightPolicy", () => {
  it("passes all four checks only when gain, clock, rate, and synchronization agree", () => {
    const report = assessTimelineDawHardwarePreflight({ gainPeakDbfs: -12, clockSource: "internal", clockLocked: true, interfaceSampleRate: 48_000, sessionSampleRate: 48_000, synchronization: "free-run", synchronizationConfirmed: true });
    expect(report).toMatchObject({ status: "ready", captureAllowed: true, automaticCaptureAllowed: false, persistenceAllowed: false });
    expect(report.checks.map((check) => check.status)).toEqual(["pass", "pass", "pass", "pass"]);
  });

  it("holds every failed preflight condition with a specific reason", () => {
    const report = assessTimelineDawHardwarePreflight({ gainPeakDbfs: -2, clockSource: "external-word-clock", clockLocked: false, interfaceSampleRate: 44_100, sessionSampleRate: 48_000, synchronization: "free-run", synchronizationConfirmed: false });
    expect(report).toMatchObject({ status: "held", captureAllowed: false });
    expect(report.checks).toHaveLength(4);
    expect(report.checks.every((check) => check.status === "hold")).toBe(true);
    expect(report.checks.map((check) => check.message).join(" ")).toMatch(/gain.*Clock lock.*sample rates.*word clock/i);
  });

  it("accepts ADAT or S/PDIF only for a confirmed digital-input clock", () => {
    for (const synchronization of ["adat", "spdif"] as const) {
      expect(assessTimelineDawHardwarePreflight({ gainPeakDbfs: -18, clockSource: "digital-input", clockLocked: true, interfaceSampleRate: 96_000, sessionSampleRate: 96_000, synchronization, synchronizationConfirmed: true }).status).toBe("ready");
    }
  });
});
