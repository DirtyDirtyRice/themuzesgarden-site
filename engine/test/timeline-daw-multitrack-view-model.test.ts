import { describe, expect, it } from "vitest";
import {
  addTimelineClip,
  archiveTimelineClip,
  clampTimelineZoom,
  createTimelineRulerMarks,
  createTimelineWaveformBars,
  moveTimelineClip,
  moveTimelineLane,
  parseTimelineLaneState,
  reconcileTimelineLanes,
  restoreTimelineClip,
  reconcileTimelineClips,
  selectTimelineClip,
  splitTimelineClip,
  timelineCanvasWidth,
  timelinePlayheadPercent,
  trimTimelineClip,
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

  it("creates one source-preserving clip for every current lane", () => {
    expect(reconcileTimelineClips(null, ["song-1", "stem-1"], 120)).toEqual([
      {
        id: "clip:song-1:1", trackId: "song-1",
        timelineStartSeconds: 0, timelineEndSeconds: 120,
        sourceStartSeconds: 0, sourceEndSeconds: 120,
        selected: true, parentClipId: null,
        archived: false,
      },
      {
        id: "clip:stem-1:1", trackId: "stem-1",
        timelineStartSeconds: 0, timelineEndSeconds: 120,
        sourceStartSeconds: 0, sourceEndSeconds: 120,
        selected: false, parentClipId: null,
        archived: false,
      },
    ]);
  });

  it("moves and trims clips without changing their source identity", () => {
    const clips = reconcileTimelineClips(null, ["song-1"], 120);
    expect(moveTimelineClip(clips, clips[0].id, 5)[0]).toMatchObject({
      timelineStartSeconds: 5,
      timelineEndSeconds: 125,
      sourceStartSeconds: 0,
      sourceEndSeconds: 120,
    });
    expect(trimTimelineClip(clips, clips[0].id, "start", 10)[0]).toMatchObject({
      timelineStartSeconds: 10,
      sourceStartSeconds: 10,
      timelineEndSeconds: 120,
      sourceEndSeconds: 120,
    });
    expect(trimTimelineClip(clips, clips[0].id, "end", -10)[0]).toMatchObject({
      timelineEndSeconds: 110,
      sourceEndSeconds: 110,
    });
  });

  it("splits a selected clip into source-linked children", () => {
    const clips = selectTimelineClip(
      reconcileTimelineClips(null, ["song-1"], 120),
      "clip:song-1:1",
    );
    const split = splitTimelineClip(clips, "clip:song-1:1", 45);
    expect(split).toHaveLength(2);
    expect(split[0]).toMatchObject({
      timelineStartSeconds: 0,
      timelineEndSeconds: 45,
      sourceStartSeconds: 0,
      sourceEndSeconds: 45,
      selected: true,
      parentClipId: "clip:song-1:1",
    });
    expect(split[1]).toMatchObject({
      timelineStartSeconds: 45,
      timelineEndSeconds: 120,
      sourceStartSeconds: 45,
      sourceEndSeconds: 120,
      selected: false,
      parentClipId: "clip:song-1:1",
    });
  });

  it("adds, archives, and restores clips without deleting history", () => {
    const original = reconcileTimelineClips(null, ["song-1"], 120);
    const added = addTimelineClip(original, {
      trackId: "song-1",
      timelineStartSeconds: 32,
      durationSeconds: 8,
    });
    expect(added).toHaveLength(2);
    expect(added[1]).toMatchObject({
      id: "clip:song-1:added:1",
      timelineStartSeconds: 32,
      timelineEndSeconds: 40,
      sourceStartSeconds: 0,
      sourceEndSeconds: 8,
      selected: true,
      archived: false,
    });
    const archived = archiveTimelineClip(added, added[1].id);
    expect(archived).toHaveLength(2);
    expect(archived[1]).toMatchObject({ archived: true, selected: false });
    expect(archived[0].selected).toBe(true);
    const restored = restoreTimelineClip(archived, added[1].id);
    expect(restored[1]).toMatchObject({ archived: false, selected: true });
    expect(restored[0].selected).toBe(false);
  });
});
