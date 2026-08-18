import { describe, expect, it } from "vitest";
import { createTimelineDawMusicianTrackPreview } from "../../lib/timeline/TimelineDawMusicianTrackPreview";

describe("TimelineDawMusicianTrackPreview", () => {
  it("previews only the audible edited portion of a track", () => {
    expect(createTimelineDawMusicianTrackPreview({
      sourceInSeconds: 2,
      sourceOutSeconds: 7,
      stretchRatio: 1,
      transformBypassed: false,
      playbackRate: 1,
    })).toEqual({ sourceStartSeconds: 2, playbackRate: 1, durationSeconds: 5, stopAfterMilliseconds: 5000 });
  });

  it("keeps a stretched preview alive for its arranged duration", () => {
    const plan = createTimelineDawMusicianTrackPreview({
      sourceInSeconds: 1,
      sourceOutSeconds: 5,
      stretchRatio: 2,
      transformBypassed: false,
      playbackRate: 0.5,
    });
    expect(plan.durationSeconds).toBe(8);
    expect(plan.stopAfterMilliseconds).toBe(8000);
  });
});
