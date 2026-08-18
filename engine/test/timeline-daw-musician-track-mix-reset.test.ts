import { describe, expect, it } from "vitest";
import { resetTimelineDawMusicianTrackMix } from "../../lib/timeline/TimelineDawMusicianTrackMixReset";

const mix = { muted: true, soloed: false, gain: 1.72, pan: -0.63 };

describe("TimelineDawMusicianTrackMixReset", () => {
  it("returns volume to normal without changing pan, mute, or solo", () => {
    expect(resetTimelineDawMusicianTrackMix(mix, "volume"))
      .toEqual({ muted: true, soloed: false, gain: 1, pan: -0.63 });
  });

  it("centers pan without changing volume, mute, or solo", () => {
    expect(resetTimelineDawMusicianTrackMix(mix, "pan"))
      .toEqual({ muted: true, soloed: false, gain: 1.72, pan: 0 });
  });

  it("can reset both sound-position controls together", () => {
    expect(resetTimelineDawMusicianTrackMix(mix, "both"))
      .toEqual({ muted: true, soloed: false, gain: 1, pan: 0 });
  });
});
