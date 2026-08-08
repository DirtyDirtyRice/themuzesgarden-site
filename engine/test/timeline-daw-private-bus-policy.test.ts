import { describe, expect, it } from "vitest";
import { parseTimelineDawPrivateBus, resolveTimelineDawPrivateRoutingAudibility } from "../../lib/timeline/TimelineDawPrivateBusPolicy";

describe("private bus policy", () => {
  it("validates durable bus mixer state", () => {
    expect(parseTimelineDawPrivateBus({ name: " Vocals ", muted: false, soloed: true, gain: 1.25, pan: -0.2 })).toEqual({ name: "Vocals", muted: false, soloed: true, gain: 1.25, pan: -0.2 });
    expect(() => parseTimelineDawPrivateBus({ name: "", muted: false, soloed: false, gain: 1, pan: 0 })).toThrow(/name/);
  });

  it("combines global lane and bus solo/mute precedence", () => {
    const buses = [{ id: "vocals", muted: false, soloed: true }, { id: "music", muted: false, soloed: false }];
    const result = resolveTimelineDawPrivateRoutingAudibility([
      { id: "lead", busId: "vocals", muted: false, soloed: true },
      { id: "double", busId: "vocals", muted: false, soloed: false },
      { id: "guitar", busId: "music", muted: false, soloed: true },
      { id: "master", busId: null, muted: false, soloed: true },
    ], buses);
    expect(Object.fromEntries(result)).toEqual({ lead: true, double: false, guitar: false, master: false });
  });
});
