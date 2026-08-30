import { describe, expect, it } from "vitest";
import { advanceTimelineDawHardwareSetupGuide, createTimelineDawHardwareSetupGuide } from "../../lib/timeline/TimelineDawHardwareSetupGuidePolicy";

describe("TimelineDawHardwareSetupGuidePolicy", () => {
  it("reveals one direct-cabling action at a time", () => {
    let guide = createTimelineDawHardwareSetupGuide({ sourceLabel: "Vocal microphone", interfaceLabel: "Scarlett 2i2", inputChannel: 1, cableType: "xlr", route: "direct" });
    expect(guide.steps).toHaveLength(4);
    expect(guide.steps[guide.currentStepIndex].instruction).toMatch(/gain fully down/);
    expect(() => advanceTimelineDawHardwareSetupGuide(guide, false)).toThrow("Confirm");
    guide = advanceTimelineDawHardwareSetupGuide(guide, true);
    expect(guide.steps[guide.currentStepIndex].instruction).toMatch(/directly.*XLR/i);
    for (let index = 1; index < 4; index += 1) guide = advanceTimelineDawHardwareSetupGuide(guide, true);
    expect(guide).toMatchObject({ currentStepIndex: 4, status: "physical-setup-complete-pending-signal-verification", persistenceAllowed: false });
  });

  it("adds explicit patch-bay input and output steps", () => {
    const guide = createTimelineDawHardwareSetupGuide({ sourceLabel: "Synth output", interfaceLabel: "Apollo", inputChannel: 4, cableType: "trs", route: "patch-bay" });
    expect(guide.steps).toHaveLength(5);
    expect(guide.steps.map((step) => step.instruction).join(" ")).toMatch(/patch-bay input.*Patch that signal/i);
    expect(guide.steps.every((step) => step.requiresHumanConfirmation && !step.automaticActionAllowed)).toBe(true);
  });

  it("rejects incomplete or invented routing details", () => {
    const valid = { sourceLabel: "Guitar", interfaceLabel: "Interface", inputChannel: 1, cableType: "ts", route: "direct" };
    expect(() => createTimelineDawHardwareSetupGuide({ ...valid, inputChannel: 0 })).toThrow("1 to 128");
    expect(() => createTimelineDawHardwareSetupGuide({ ...valid, cableType: "usb" })).toThrow("XLR, TRS, or TS");
    expect(() => createTimelineDawHardwareSetupGuide({ ...valid, route: "wireless" })).toThrow("direct or patch-bay");
  });
});
