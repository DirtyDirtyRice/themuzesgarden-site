import { describe, expect, it } from "vitest";
import {
  addTimelineClip,
  addTimelineAutomationPoint,
  addTimelineMarker,
  archiveTimelineMarker,
  archiveTimelineAutomationPoint,
  archiveSelectedTimelineClips,
  archiveTimelineClip,
  clampTimelineZoom,
  copySelectedTimelineClips,
  createTimelineRulerMarks,
  createTimelineSections,
  createTimelineWaveformBars,
  duplicateSelectedTimelineClips,
  moveTimelineClip,
  moveTimelineAutomationPoint,
  moveSelectedTimelineClips,
  moveTimelineLane,
  normalizeTimelineLoopRegion,
  pasteTimelineClips,
  parseTimelineLaneState,
  reconcileTimelineLanes,
  reconcileTimelineMarkers,
  reconcileTimelineAutomation,
  restoreTimelineClip,
  restoreTimelineMarker,
  renameTimelineMarker,
  reconcileTimelineClips,
  selectTimelineClip,
  snapTimelineSeconds,
  splitTimelineClip,
  timelineCanvasWidth,
  timelinePlayheadPercent,
  timelineSecondsFromPixels,
  timelineAutomationValueAt,
  toggleTimelineClipSelection,
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

  it("normalizes a visible loop region within the timeline", () => {
    expect(normalizeTimelineLoopRegion(30, 90, 120)).toEqual({
      startSeconds: 30,
      endSeconds: 90,
      startPercent: 25,
      widthPercent: 50,
    });
    expect(normalizeTimelineLoopRegion(-5, 200, 120)).toEqual({
      startSeconds: 0,
      endSeconds: 120,
      startPercent: 0,
      widthPercent: 100,
    });
    expect(normalizeTimelineLoopRegion(90, 30, 120)).toBeNull();
  });

  it("creates named arrangement sections from persistent markers", () => {
    const first = addTimelineMarker([], 0, 120);
    const second = addTimelineMarker(first, 30, 120);
    const named = renameTimelineMarker(
      renameTimelineMarker(second, first[0].id, "Intro"),
      second[1].id,
      "Verse",
    );
    expect(createTimelineSections(named, 120)).toEqual([
      {
        markerId: "marker:1", label: "Intro",
        startSeconds: 0, endSeconds: 30, startPercent: 0, widthPercent: 25,
      },
      {
        markerId: "marker:2", label: "Verse",
        startSeconds: 30, endSeconds: 120, startPercent: 25, widthPercent: 75,
      },
    ]);
    expect(reconcileTimelineMarkers(JSON.stringify(named), 20).map((marker) => marker.seconds))
      .toEqual([0, 20]);
    expect(restoreTimelineMarker(
      archiveTimelineMarker(named, "marker:1"),
      "marker:1",
    )[0]).toMatchObject({ archived: false, selected: true });
  });

  it("writes, replaces, interpolates, and archives automation points", () => {
    const first = addTimelineAutomationPoint([], {
      trackId: "song-1", parameter: "volume", seconds: 0, value: 0.2, durationSeconds: 120,
    });
    const second = addTimelineAutomationPoint(first, {
      trackId: "song-1", parameter: "volume", seconds: 10, value: 0.8, durationSeconds: 120,
    });
    expect(timelineAutomationValueAt(second, "song-1", "volume", 5)).toBe(0.5);
    const replaced = addTimelineAutomationPoint(second, {
      trackId: "song-1", parameter: "volume", seconds: 10, value: 2, durationSeconds: 120,
    });
    expect(replaced).toHaveLength(2);
    expect(replaced[1].value).toBe(1);
    expect(reconcileTimelineAutomation(JSON.stringify(replaced), ["song-1"], 5)[1].seconds).toBe(5);
    expect(archiveTimelineAutomationPoint(replaced, replaced[1].id)[1].archived).toBe(true);
  });

  it("drags automation points within timeline and parameter bounds", () => {
    const volume = addTimelineAutomationPoint([], {
      trackId: "song-1", parameter: "volume", seconds: 10, value: 0.5, durationSeconds: 120,
    });
    expect(moveTimelineAutomationPoint(volume, volume[0].id, {
      seconds: 150, value: 2, durationSeconds: 120,
    })[0]).toMatchObject({ seconds: 120, value: 1, selected: true });
    const pan = addTimelineAutomationPoint(volume, {
      trackId: "song-1", parameter: "pan", seconds: 20, value: 0, durationSeconds: 120,
    });
    expect(moveTimelineAutomationPoint(pan, pan[1].id, {
      seconds: -5, value: -2, durationSeconds: 120,
    })[1]).toMatchObject({ seconds: 0, value: -1, selected: true });
  });

  it("converts pointer movement into timeline seconds", () => {
    expect(timelineSecondsFromPixels(120, 1440, 180)).toBe(15);
    expect(timelineSecondsFromPixels(-48, 960, 120)).toBe(-6);
    expect(timelineSecondsFromPixels(40, 0, 120)).toBe(0);
  });

  it("snaps timeline positions to the selected grid", () => {
    expect(snapTimelineSeconds(3.62, 0.25)).toBe(3.5);
    expect(snapTimelineSeconds(3.62, 1)).toBe(4);
    expect(snapTimelineSeconds(-0.7, 0.5)).toBe(-0.5);
    expect(snapTimelineSeconds(3.627, 0)).toBe(3.63);
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

  it("toggles multiselect and moves selected clips as a bounded group", () => {
    const clips = reconcileTimelineClips(null, ["song-1", "stem-1"], 120);
    const selected = toggleTimelineClipSelection(clips, clips[1].id);
    expect(selected.map((clip) => clip.selected)).toEqual([true, true]);
    const moved = moveSelectedTimelineClips(selected, 8);
    expect(moved.map((clip) => clip.timelineStartSeconds)).toEqual([8, 8]);
    expect(moveSelectedTimelineClips(moved, -20).map((clip) => clip.timelineStartSeconds))
      .toEqual([0, 0]);
    const archived = archiveSelectedTimelineClips(moved);
    expect(archived.every((clip) => clip.archived)).toBe(true);
    expect(archived.every((clip) => !clip.selected)).toBe(true);
  });

  it("copies, pastes, and duplicates selected clips with stable offsets", () => {
    const clips = toggleTimelineClipSelection(
      reconcileTimelineClips(null, ["song-1", "stem-1"], 120),
      "clip:stem-1:1",
    );
    const copied = copySelectedTimelineClips(clips);
    const pasted = pasteTimelineClips(clips, copied, 30);
    expect(pasted.slice(-2).map((clip) => ({
      id: clip.id,
      start: clip.timelineStartSeconds,
      selected: clip.selected,
      parent: clip.parentClipId,
    }))).toEqual([
      { id: "clip:song-1:copy:1", start: 30, selected: true, parent: "clip:song-1:1" },
      { id: "clip:stem-1:copy:2", start: 30, selected: true, parent: "clip:stem-1:1" },
    ]);
    const duplicated = duplicateSelectedTimelineClips(pasted, 5);
    expect(duplicated.slice(-2).map((clip) => clip.timelineStartSeconds)).toEqual([35, 35]);
    expect(duplicated.slice(-2).map((clip) => clip.id)).toEqual([
      "clip:song-1:copy:3",
      "clip:stem-1:copy:4",
    ]);
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
