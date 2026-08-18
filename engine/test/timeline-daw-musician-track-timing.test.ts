import { describe, expect, it } from "vitest";
import { resolveTimelineDawMusicianTrackTiming } from "../../lib/timeline/TimelineDawMusicianTrackTiming";

describe("truthful musician track timing", () => {
  it("reports matching source and audible timing at original speed", () => {
    expect(resolveTimelineDawMusicianTrackTiming({ timelineStartSeconds: 10, sourceInSeconds: 2, sourceOutSeconds: 7, stretchRatio: 1, transformBypassed: false }))
      .toEqual({ sourceDurationSeconds: 5, audibleDurationSeconds: 5, audibleEndSeconds: 15 });
  });

  it("reports what musicians hear for slowed, sped-up, and bypassed tracks", () => {
    expect(resolveTimelineDawMusicianTrackTiming({ timelineStartSeconds: 10, sourceInSeconds: 2, sourceOutSeconds: 7, stretchRatio: 1.5, transformBypassed: false }).audibleEndSeconds).toBe(17.5);
    expect(resolveTimelineDawMusicianTrackTiming({ timelineStartSeconds: 10, sourceInSeconds: 2, sourceOutSeconds: 7, stretchRatio: 0.5, transformBypassed: false }).audibleEndSeconds).toBe(12.5);
    expect(resolveTimelineDawMusicianTrackTiming({ timelineStartSeconds: 10, sourceInSeconds: 2, sourceOutSeconds: 7, stretchRatio: 1.5, transformBypassed: true }).audibleEndSeconds).toBe(15);
  });

  it("rejects invalid and out-of-song timing", () => {
    expect(() => resolveTimelineDawMusicianTrackTiming({ timelineStartSeconds: 0, sourceInSeconds: 7, sourceOutSeconds: 2, stretchRatio: 1, transformBypassed: false })).toThrow(/safe song timeline/);
    expect(() => resolveTimelineDawMusicianTrackTiming({ timelineStartSeconds: 86_399, sourceInSeconds: 0, sourceOutSeconds: 5, stretchRatio: 1, transformBypassed: false })).toThrow(/safe song timeline/);
  });
});
