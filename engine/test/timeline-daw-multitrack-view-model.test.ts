import { describe, expect, it } from "vitest";
import {
  clampTimelineZoom,
  createTimelineRulerMarks,
  createTimelineWaveformBars,
  moveTimelineLane,
  parseTimelineLaneState,
  reconcileTimelineLanes,
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

  it("reconciles saved lane order with current project tracks", () => {
    const saved = JSON.stringify([
      { trackId: "stem-2", selected: true, muted: true, soloed: false },
      { trackId: "song-1", selected: false, muted: false, soloed: false },
      { trackId: "removed", selected: false, muted: false, soloed: true },
    ]);
    expect(reconcileTimelineLanes(saved, ["stem-1", "stem-2"], "song-1")).toEqual([
      { trackId: "stem-2", selected: true, muted: true, soloed: false },
      { trackId: "song-1", selected: false, muted: false, soloed: false },
      { trackId: "stem-1", selected: false, muted: false, soloed: false },
    ]);
  });

  it("moves lanes without mutating the current order", () => {
    const lanes = reconcileTimelineLanes(null, ["stem-1", "stem-2"], "song-1");
    const moved = moveTimelineLane(lanes, "stem-2", -1);
    expect(moved.map((lane) => lane.trackId)).toEqual(["song-1", "stem-2", "stem-1"]);
    expect(lanes.map((lane) => lane.trackId)).toEqual(["song-1", "stem-1", "stem-2"]);
    expect(moveTimelineLane(lanes, "song-1", -1)).toEqual(lanes);
  });
});
