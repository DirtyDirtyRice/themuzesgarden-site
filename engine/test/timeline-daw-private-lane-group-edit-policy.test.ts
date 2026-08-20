import { describe, expect, it } from "vitest";
import { parseTimelineDawPrivateLaneGroupEdit } from "../../lib/timeline/TimelineDawPrivateLaneGroupEditPolicy";

const lanes = [
  { id: "a", timelineStartSeconds: 1, sourceInSeconds: 0, sourceOutSeconds: 2, sampleRate: 48_000 },
  { id: "b", timelineStartSeconds: 3, sourceInSeconds: 1, sourceOutSeconds: 2, sampleRate: 44_100 },
];

describe("private lane group edit policy", () => {
  it("restores track sound without requiring multiple tracks", () => {
    expect(parseTimelineDawPrivateLaneGroupEdit({ groupAction: "audibility", clearSolo: true, unmute: false }, [lanes[0]]))
      .toEqual({ action: "audibility", clearSolo: true, unmute: false });
    expect(() => parseTimelineDawPrivateLaneGroupEdit({ groupAction: "audibility", clearSolo: false, unmute: false }, [lanes[0]]))
      .toThrow(/Choose Solo, Mute, or both/);
  });
  it("normalizes moves while preserving relative offsets", () => {
    const edit = parseTimelineDawPrivateLaneGroupEdit({ groupAction: "move", deltaSeconds: 0.2504 }, lanes);
    expect(edit).toEqual({ action: "move", deltaSeconds: 0.25 });
    expect(lanes.map((lane) => lane.timelineStartSeconds + (edit.action === "move" ? edit.deltaSeconds : 0))).toEqual([1.25, 3.25]);
  });

  it("aligns selected starts to the earliest selected track", () => {
    expect(parseTimelineDawPrivateLaneGroupEdit({ groupAction: "align-start" }, lanes)).toEqual({
      action: "align-start",
      timelineStartSeconds: 1,
    });
    expect(() => parseTimelineDawPrivateLaneGroupEdit({ groupAction: "align-start" }, [
      { ...lanes[0], id: "c" },
      { ...lanes[0], id: "d" },
    ])).toThrow(/already start together/);
  });

  it("aligns audible endings to the latest selected ending", () => {
    expect(parseTimelineDawPrivateLaneGroupEdit({ groupAction: "align-end" }, [
      { ...lanes[0], timelineStartSeconds: 1, sourceOutSeconds: 3, stretchRatio: 2, transformBypassed: false },
      { ...lanes[1], timelineStartSeconds: 5, sourceInSeconds: 0, sourceOutSeconds: 2, stretchRatio: 0.5, transformBypassed: false },
    ])).toEqual({ action: "align-end", timelineStartSecondsById: { a: 1, b: 6 } });
    expect(parseTimelineDawPrivateLaneGroupEdit({ groupAction: "align-end" }, [
      { ...lanes[0], timelineStartSeconds: 1, sourceOutSeconds: 3, stretchRatio: 2, transformBypassed: true },
      { ...lanes[1], timelineStartSeconds: 4, sourceInSeconds: 0, sourceOutSeconds: 2, stretchRatio: 0.5, transformBypassed: false },
    ])).toEqual({ action: "align-end", timelineStartSecondsById: { a: 2, b: 4 } });
  });

  it("places selected tracks one after another in their current order", () => {
    expect(parseTimelineDawPrivateLaneGroupEdit({ groupAction: "sequence" }, [
      { ...lanes[1], timelineStartSeconds: 5, sourceInSeconds: 0, sourceOutSeconds: 2, stretchRatio: 0.5, transformBypassed: false },
      { ...lanes[0], timelineStartSeconds: 1, sourceOutSeconds: 3, stretchRatio: 2, transformBypassed: false },
    ])).toEqual({ action: "sequence", timelineStartSecondsById: { a: 1, b: 7 } });
    expect(() => parseTimelineDawPrivateLaneGroupEdit({ groupAction: "sequence" }, [
      { ...lanes[0], timelineStartSeconds: 1, sourceOutSeconds: 3 },
      { ...lanes[1], timelineStartSeconds: 4, sourceInSeconds: 0, sourceOutSeconds: 2 },
    ])).toThrow(/already placed one after another/);
  });

  it("adds requested space between sequenced tracks", () => {
    expect(parseTimelineDawPrivateLaneGroupEdit({ groupAction: "sequence", sequenceGapSeconds: 0.1 }, [
      { ...lanes[0], timelineStartSeconds: 1, sourceOutSeconds: 3 },
      { ...lanes[1], timelineStartSeconds: 8, sourceInSeconds: 0, sourceOutSeconds: 2 },
    ])).toEqual({ action: "sequence", timelineStartSecondsById: { a: 1, b: 4.1 } });
    expect(parseTimelineDawPrivateLaneGroupEdit({ groupAction: "sequence", sequenceGapSeconds: 1 }, [
      { ...lanes[0], timelineStartSeconds: 1, sourceOutSeconds: 3 },
      { ...lanes[1], timelineStartSeconds: 8, sourceInSeconds: 0, sourceOutSeconds: 2 },
    ])).toEqual({ action: "sequence", timelineStartSecondsById: { a: 1, b: 5 } });
    expect(() => parseTimelineDawPrivateLaneGroupEdit({ groupAction: "sequence", sequenceGapSeconds: 61 }, lanes)).toThrow(/between 0 and 60/);
  });

  it("validates common mixer and fade values across the selection", () => {
    expect(parseTimelineDawPrivateLaneGroupEdit({ groupAction: "mix", muted: true, gain: 1.2, pan: -0.25 }, lanes)).toEqual({ action: "mix", muted: true, gain: 1.2, pan: -0.25 });
    expect(parseTimelineDawPrivateLaneGroupEdit({ groupAction: "fade", fadeInSeconds: 0.25, fadeOutSeconds: 0.5 }, lanes)).toMatchObject({ action: "fade" });
    expect(() => parseTimelineDawPrivateLaneGroupEdit({ groupAction: "fade", fadeInSeconds: 0.6, fadeOutSeconds: 0.5 }, lanes)).toThrow(/fit every selected/);
  });

  it("validates an exact transform for every selected track as one edit", () => {
    const a = { stretchRatio: 0.8, pitchSemitones: 2, algorithm: "preserve-pitch", quality: "high", bypassed: false };
    const b = { stretchRatio: 1.25, pitchSemitones: -1, algorithm: "preserve-pitch", quality: "high", bypassed: false };
    expect(parseTimelineDawPrivateLaneGroupEdit({ groupAction: "transform", transformById: { a, b } }, lanes))
      .toEqual({ action: "transform", transformById: { a, b } });
    expect(() => parseTimelineDawPrivateLaneGroupEdit({ groupAction: "transform", transformById: { a } }, lanes))
      .toThrow(/match the selected tracks exactly/);
    expect(() => parseTimelineDawPrivateLaneGroupEdit({ groupAction: "transform", transformById: { a, b: { ...b, stretchRatio: 10 } } }, lanes))
      .toThrow(/Stretch ratio/);
  });

  it("requires a distinct multi-region selection and bounded positions", () => {
    expect(() => parseTimelineDawPrivateLaneGroupEdit({ groupAction: "move", deltaSeconds: 1 }, lanes.slice(0, 1))).toThrow(/at least two/);
    expect(() => parseTimelineDawPrivateLaneGroupEdit({ groupAction: "move", deltaSeconds: -2 }, lanes)).toThrow(/inside the session/);
  });
});
