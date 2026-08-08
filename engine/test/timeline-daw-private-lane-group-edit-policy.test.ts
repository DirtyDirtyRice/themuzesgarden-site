import { describe, expect, it } from "vitest";
import { parseTimelineDawPrivateLaneGroupEdit } from "../../lib/timeline/TimelineDawPrivateLaneGroupEditPolicy";

const lanes = [
  { id: "a", timelineStartSeconds: 1, sourceInSeconds: 0, sourceOutSeconds: 2, sampleRate: 48_000 },
  { id: "b", timelineStartSeconds: 3, sourceInSeconds: 1, sourceOutSeconds: 2, sampleRate: 44_100 },
];

describe("private lane group edit policy", () => {
  it("normalizes moves while preserving relative offsets", () => {
    const edit = parseTimelineDawPrivateLaneGroupEdit({ groupAction: "move", deltaSeconds: 0.2504 }, lanes);
    expect(edit).toEqual({ action: "move", deltaSeconds: 0.25 });
    expect(lanes.map((lane) => lane.timelineStartSeconds + (edit.action === "move" ? edit.deltaSeconds : 0))).toEqual([1.25, 3.25]);
  });

  it("validates common mixer and fade values across the selection", () => {
    expect(parseTimelineDawPrivateLaneGroupEdit({ groupAction: "mix", muted: true, gain: 1.2, pan: -0.25 }, lanes)).toEqual({ action: "mix", muted: true, gain: 1.2, pan: -0.25 });
    expect(parseTimelineDawPrivateLaneGroupEdit({ groupAction: "fade", fadeInSeconds: 0.25, fadeOutSeconds: 0.5 }, lanes)).toMatchObject({ action: "fade" });
    expect(() => parseTimelineDawPrivateLaneGroupEdit({ groupAction: "fade", fadeInSeconds: 0.6, fadeOutSeconds: 0.5 }, lanes)).toThrow(/fit every selected/);
  });

  it("requires a distinct multi-region selection and bounded positions", () => {
    expect(() => parseTimelineDawPrivateLaneGroupEdit({ groupAction: "move", deltaSeconds: 1 }, lanes.slice(0, 1))).toThrow(/at least two/);
    expect(() => parseTimelineDawPrivateLaneGroupEdit({ groupAction: "move", deltaSeconds: -2 }, lanes)).toThrow(/inside the session/);
  });
});
