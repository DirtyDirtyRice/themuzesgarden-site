import { describe, expect, it } from "vitest";
import { planTimelineDawTrackSolo } from "../../lib/timeline/TimelineDawSoloModePolicy";

const tracks = [
  { id: "drums", soloed: true },
  { id: "bass", soloed: false },
  { id: "vocal", soloed: true },
];

describe("DAW professional Solo modes", () => {
  it("adds another track without clearing existing solos", () => {
    expect(planTimelineDawTrackSolo(tracks, "bass", "additive")).toEqual([{ id: "bass", soloed: true }]);
  });

  it("clears other solos before exclusively soloing the requested track", () => {
    expect(planTimelineDawTrackSolo(tracks, "bass", "exclusive")).toEqual([
      { id: "drums", soloed: false },
      { id: "vocal", soloed: false },
      { id: "bass", soloed: true },
    ]);
  });

  it("always lets the musician turn the current solo off", () => {
    expect(planTimelineDawTrackSolo(tracks, "drums", "exclusive")).toEqual([{ id: "drums", soloed: false }]);
  });

  it("refuses an exclusive transition that a track lock would make incomplete", () => {
    expect(() => planTimelineDawTrackSolo([{ id: "drums", soloed: true, locked: true }, { id: "bass", soloed: false }], "bass", "exclusive")).toThrow(/other Solo track/i);
  });
});
