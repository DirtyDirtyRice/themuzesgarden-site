import { describe, expect, it } from "vitest";
import { resolveTimelineDawMusicianTrackMove } from "../../lib/timeline/TimelineDawMusicianTrackMove";

describe("TimelineDawMusicianTrackMove", () => {
  it("moves a track earlier or later without allowing negative song time", () => {
    expect(resolveTimelineDawMusicianTrackMove({ currentStartSeconds: 8.25, changeSeconds: -1 })).toBe(7.25);
    expect(resolveTimelineDawMusicianTrackMove({ currentStartSeconds: 8.25, changeSeconds: 1 })).toBe(9.25);
    expect(resolveTimelineDawMusicianTrackMove({ currentStartSeconds: 0.25, changeSeconds: -1 })).toBe(0);
  });

  it("moves directly to the play position with millisecond precision", () => {
    expect(resolveTimelineDawMusicianTrackMove({ currentStartSeconds: 3, destinationSeconds: 12.3456 })).toBe(12.346);
  });
});
