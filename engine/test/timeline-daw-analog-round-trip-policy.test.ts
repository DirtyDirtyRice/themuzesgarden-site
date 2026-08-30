import { describe, expect, it } from "vitest";
import { assessTimelineDawAnalogRoundTrip } from "../../lib/timeline/TimelineDawAnalogRoundTripPolicy";

describe("TimelineDawAnalogRoundTripPolicy", () => {
  it("uses the median of stable repeated measurements and converts it to samples", () => {
    expect(assessTimelineDawAnalogRoundTrip({ measurementsMs: [10, 10.5, 11], sampleRate: 48_000, compensationApprovedByHuman: true })).toMatchObject({ status: "ready", medianRoundTripMs: 10.5, spreadMs: 1, compensationSamples: 504, placementOffsetSamples: -504, applyAllowed: true, sourceAudioMutationAllowed: false, automaticApplyAllowed: false, persistenceAllowed: false });
  });

  it("holds unstable measurements even when a musician approved them", () => {
    const report = assessTimelineDawAnalogRoundTrip({ measurementsMs: [8, 12, 17], sampleRate: 48_000, compensationApprovedByHuman: true });
    expect(report).toMatchObject({ status: "held", applyAllowed: false, spreadMs: 9 });
    expect(report.reasons.join(" ")).toMatch(/vary.*measure again/i);
  });

  it("calculates but does not apply a stable offset without human approval", () => {
    const report = assessTimelineDawAnalogRoundTrip({ measurementsMs: [5, 5, 5], sampleRate: 96_000, compensationApprovedByHuman: false });
    expect(report).toMatchObject({ status: "held", compensationSamples: 480, placementOffsetSamples: -480, applyAllowed: false });
    expect(report.reasons.join(" ")).toMatch(/approve/i);
  });

  it("rejects guessed, missing, or implausible measurements", () => {
    expect(() => assessTimelineDawAnalogRoundTrip({ measurementsMs: [10, 10], sampleRate: 48_000, compensationApprovedByHuman: true })).toThrow(/three to nine/i);
    expect(() => assessTimelineDawAnalogRoundTrip({ measurementsMs: [10, 0, 10], sampleRate: 48_000, compensationApprovedByHuman: true })).toThrow(/greater than 0/i);
  });
});
