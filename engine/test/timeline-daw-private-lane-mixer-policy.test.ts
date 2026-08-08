import { describe, expect, it } from "vitest";
import { parseTimelineDawPrivateLaneMix, resolveTimelineDawPrivateLaneAudibility } from "../../lib/timeline/TimelineDawPrivateLaneMixerPolicy";

describe("TimelineDawPrivateLaneMixerPolicy", () => {
  it("normalizes bounded mixer settings", () => {
    expect(parseTimelineDawPrivateLaneMix({ muted: false, soloed: true, gain: 1.25, pan: -0.5 }))
      .toEqual({ muted: false, soloed: true, gain: 1.25, pan: -0.5 });
    expect(() => parseTimelineDawPrivateLaneMix({ muted: false, soloed: false, gain: 2.1, pan: 0 })).toThrow(/gain/);
    expect(() => parseTimelineDawPrivateLaneMix({ muted: false, soloed: false, gain: 1, pan: -1.1 })).toThrow(/pan/);
  });

  it("applies solo precedence while mute always wins", () => {
    expect([...resolveTimelineDawPrivateLaneAudibility([
      { id: "a", muted: false, soloed: false },
      { id: "b", muted: true, soloed: false },
    ])]).toEqual([["a", true], ["b", false]]);
    expect([...resolveTimelineDawPrivateLaneAudibility([
      { id: "a", muted: false, soloed: false },
      { id: "b", muted: false, soloed: true },
      { id: "c", muted: true, soloed: true },
    ])]).toEqual([["a", false], ["b", true], ["c", false]]);
  });
});
