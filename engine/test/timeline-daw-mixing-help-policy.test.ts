import { describe, expect, it } from "vitest";
import { TIMELINE_DAW_MIXING_HELP_STEPS, timelineDawMixingHelpStorageKey } from "../../lib/timeline/TimelineDawMixingHelpPolicy";

describe("timeline DAW baby-step mixing help", () => {
  it("moves from one track through a complete safe mix review", () => {
    expect(TIMELINE_DAW_MIXING_HELP_STEPS).toHaveLength(8);
    expect(TIMELINE_DAW_MIXING_HELP_STEPS.map((step) => step.title).join(" ")).toMatch(/track.*Play.*level.*left or right.*mute and solo.*Compare.*output and sends.*whole mix/i);
  });
  it("reminds musicians to preserve headroom and source recordings", () => expect(TIMELINE_DAW_MIXING_HELP_STEPS.map((step) => step.instruction).join(" ")).toMatch(/clipping.*meters stay safe.*source recording is unchanged/i));
  it("uses a session-scoped progress key without private mix content", () => expect(timelineDawMixingHelpStorageKey("session-1")).toBe("muzes:daw:mixing-help:v1:session-1"));
  it("rejects a missing session", () => expect(() => timelineDawMixingHelpStorageKey(" ")).toThrow(/valid session/i));
});
