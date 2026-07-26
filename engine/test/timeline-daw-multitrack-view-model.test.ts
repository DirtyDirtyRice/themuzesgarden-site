import { describe, expect, it } from "vitest";
import {
  clampTimelineZoom,
  createTimelineRulerMarks,
  createTimelineWaveformBars,
  parseTimelineLaneState,
  timelineCanvasWidth,
  timelinePlayheadPercent,
} from "../../lib/timeline/TimelineDawMultitrackViewModel";

describe("TimelineDawMultitrackViewModel", () => {
  it("clamps zoom and expands the timeline canvas deterministically", () => {
    expect(clampTimelineZoom(0.1)).toBe(0.5);
    expect(clampTimelineZoom(2.12)).toBe(2);
    expect(clampTimelineZoom(99)).toBe(8);
    expect(timelineCanvasWidth(240, 2)).toBe(3840);
  });

  it("maps elapsed time to a bounded playhead position", () => {
    expect(timelinePlayheadPercent(30, 120)).toBe(25);
    expect(timelinePlayheadPercent(150, 120)).toBe(100);
    expect(timelinePlayheadPercent(Number.NaN, 120)).toBe(0);
  });

  it("creates readable ruler marks at zoom-aware intervals", () => {
    expect(createTimelineRulerMarks(120, 1).map((mark) => mark.seconds)).toEqual([
      0, 15, 30, 45, 60, 75, 90, 105, 120,
    ]);
    expect(createTimelineRulerMarks(20, 4).map((mark) => mark.seconds)).toEqual([
      0, 5, 10, 15, 20,
    ]);
  });

  it("creates stable waveform bars from the song identity", () => {
    const first = createTimelineWaveformBars("song-1", 32);
    expect(first).toHaveLength(32);
    expect(createTimelineWaveformBars("song-1", 32)).toEqual(first);
    expect(createTimelineWaveformBars("song-2", 32)).not.toEqual(first);
  });

  it("restores only lane state belonging to the active track", () => {
    expect(parseTimelineLaneState(
      JSON.stringify({ trackId: "song-1", selected: false, muted: true, soloed: true }),
      "song-1",
    )).toEqual({ trackId: "song-1", selected: false, muted: true, soloed: true });
    expect(parseTimelineLaneState(
      JSON.stringify({ trackId: "other", muted: true, soloed: true }),
      "song-1",
    )).toEqual({ trackId: "song-1", selected: true, muted: false, soloed: false });
  });
});
