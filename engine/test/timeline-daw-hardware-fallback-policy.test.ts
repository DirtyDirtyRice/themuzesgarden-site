import { describe, expect, it } from "vitest";
import { createTimelineDawHardwareFallbackPlan } from "../../lib/timeline/TimelineDawHardwareFallbackPolicy";

describe("TimelineDawHardwareFallbackPolicy", () => {
  it("offers safe digital work while keeping analog capture explicitly incomplete", () => {
    const plan = createTimelineDawHardwareFallbackPlan({ task: "analog-capture", missing: ["audio-interface", "correct-cable"], allowDigitalFallback: true });
    expect(plan).toMatchObject({ status: "digital-work-available", digitalWorkAllowed: true, completionClaimAllowed: false, automaticSubstitutionAllowed: false, persistenceAllowed: false });
    expect(plan.digitalFallback).toMatch(/digital drafts.*analog performance later/i);
    expect(plan.deferredInstructions.join(" ")).toMatch(/NOT COMPLETED.*audio interface.*correct cable.*safety gate/i);
  });

  it("fully defers a task when no digital substitute is wanted", () => {
    expect(createTimelineDawHardwareFallbackPlan({ task: "analog-monitoring", missing: ["monitoring-output"], allowDigitalFallback: false })).toMatchObject({ status: "fully-deferred", digitalWorkAllowed: false, digitalFallback: null });
  });

  it("adds measurement-specific return steps for unavailable loopback hardware", () => {
    const plan = createTimelineDawHardwareFallbackPlan({ task: "analog-round-trip", missing: ["correct-cable"], allowDigitalFallback: true });
    expect(plan.deferredInstructions.join(" ")).toMatch(/three measurements.*measured offset/i);
  });

  it("rejects empty or invented missing-hardware claims", () => {
    expect(() => createTimelineDawHardwareFallbackPlan({ task: "analog-capture", missing: [], allowDigitalFallback: true })).toThrow(/at least one/i);
    expect(() => createTimelineDawHardwareFallbackPlan({ task: "analog-capture", missing: ["magic-box"], allowDigitalFallback: true })).toThrow(/valid/i);
  });
});
