import { describe, expect, it } from "vitest";
import { analyzeTimelineDawSessionLiveSetFlow, createTimelineDawSessionArrangementPlan, createTimelineDawSessionArrangementPreview, createTimelineDawSessionClipLaunchPlan, createTimelineDawSessionCompTake, createTimelineDawSessionConsolidatedArrangementPlan, createTimelineDawSessionFollowIndex, createTimelineDawSessionLaunchDelay, createTimelineDawSessionLiveCue, createTimelineDawSessionLiveProgressLabel, createTimelineDawSessionLiveSetPlan, createTimelineDawSessionNavigationIndex, createTimelineDawSessionPassProgress, createTimelineDawSessionPerformanceEvent, createTimelineDawSessionSavedTake, createTimelineDawSessionSceneLaunch, createTimelineDawSessionScenes, createTimelineDawSessionTakeLaneBundle, createTimelineDawSessionTakeSummary, moveTimelineDawSessionScene, orderTimelineDawSessionScenes, parseTimelineDawSessionLiveSetPlan, parseTimelineDawSessionTakeLaneBundle, quantizeTimelineDawSessionPerformanceTake, resolveTimelineDawSessionFollowTargetIndex, resolveTimelineDawSessionKeyboardCommand, resolveTimelineDawSessionSceneFollowAction, resolveTimelineDawSessionSceneHotkeyIndex, resolveTimelineDawSessionScenePlayCount } from "../../lib/timeline/TimelineDawSessionViewPolicy";

describe("Timeline DAW Session View policy", () => {
  it("groups matching named regions into scenes across tracks", () => {
    const scenes = createTimelineDawSessionScenes({
      drums: [
        { id: "d-verse", laneId: "drums", name: "Verse", startSeconds: 0, endSeconds: 8, color: "cyan" },
        { id: "d-chorus", laneId: "drums", name: "Chorus", startSeconds: 8, endSeconds: 16, color: "violet" },
      ],
      bass: [
        { id: "b-verse", laneId: "bass", name: "verse", startSeconds: 1, endSeconds: 9, color: "cyan" },
      ],
    }, ["drums", "bass"]);

    expect(scenes.map((scene) => [scene.name, scene.slots.length])).toEqual([["Verse", 2], ["Chorus", 1]]);
    expect(createTimelineDawSessionSceneLaunch(scenes[0])).toEqual([
      { laneId: "drums", startSeconds: 0, endSeconds: 8 },
      { laneId: "bass", startSeconds: 1, endSeconds: 9 },
    ]);
  });

  it("uses the earliest duplicate label on one track and rejects unsafe launches", () => {
    const [scene] = createTimelineDawSessionScenes({
      vocals: [
        { id: "later", laneId: "vocals", name: "Hook", startSeconds: 8, endSeconds: 12, color: "rose" },
        { id: "earlier", laneId: "vocals", name: "Hook", startSeconds: 2, endSeconds: 6, color: "rose" },
      ],
    }, ["vocals"]);
    expect(scene.slots).toHaveLength(1);
    expect(scene.slots[0].id).toBe("earlier");
    expect(() => createTimelineDawSessionSceneLaunch({ ...scene, slots: [...scene.slots, scene.slots[0]] })).toThrow("only one clip per track");
  });

  it("quantizes queued launches to beats and bars", () => {
    expect(createTimelineDawSessionLaunchDelay({ playheadSeconds: 1.25, bpm: 120, quantization: "beat" })).toBe(250);
    expect(createTimelineDawSessionLaunchDelay({ playheadSeconds: 1.25, bpm: 120, quantization: "two-beats" })).toBe(750);
    expect(createTimelineDawSessionLaunchDelay({ playheadSeconds: 1.25, bpm: 120, quantization: "bar" })).toBe(750);
    expect(createTimelineDawSessionLaunchDelay({ playheadSeconds: 2, bpm: 120, quantization: "bar" })).toBe(0);
    expect(createTimelineDawSessionLaunchDelay({ playheadSeconds: 1.25, bpm: 120, quantization: "immediate" })).toBe(0);
    expect(() => createTimelineDawSessionLaunchDelay({ playheadSeconds: 1, bpm: 10, quantization: "bar" })).toThrow("between 30 and 300");
  });

  it("resolves safe stop, next-scene, and loop follow actions", () => {
    expect(createTimelineDawSessionFollowIndex(0, 3, "stop")).toBeNull();
    expect(createTimelineDawSessionFollowIndex(0, 3, "next")).toBe(1);
    expect(createTimelineDawSessionFollowIndex(2, 3, "next")).toBeNull();
    expect(createTimelineDawSessionFollowIndex(1, 3, "loop")).toBe(1);
    expect(createTimelineDawSessionFollowIndex(-1, 3, "loop")).toBeNull();
  });

  it("navigates previous, replay, and next scenes without wrapping", () => {
    expect(createTimelineDawSessionNavigationIndex(1, 3, "previous")).toBe(0);
    expect(createTimelineDawSessionNavigationIndex(1, 3, "replay")).toBe(1);
    expect(createTimelineDawSessionNavigationIndex(1, 3, "next")).toBe(2);
    expect(createTimelineDawSessionNavigationIndex(0, 3, "previous")).toBeNull();
    expect(createTimelineDawSessionNavigationIndex(2, 3, "next")).toBeNull();
  });

  it("scopes performance shortcuts to the focused non-editable launcher", () => {
    const base = { launcherFocused: true, editableTarget: false };
    expect(resolveTimelineDawSessionKeyboardCommand({ ...base, key: "p" })).toBe("previous");
    expect(resolveTimelineDawSessionKeyboardCommand({ ...base, key: "R" })).toBe("replay");
    expect(resolveTimelineDawSessionKeyboardCommand({ ...base, key: "n" })).toBe("next");
    expect(resolveTimelineDawSessionKeyboardCommand({ ...base, key: " " })).toBe("stop");
    expect(resolveTimelineDawSessionKeyboardCommand({ ...base, key: "n", editableTarget: true })).toBeNull();
    expect(resolveTimelineDawSessionKeyboardCommand({ ...base, key: "n", launcherFocused: false })).toBeNull();
    expect(resolveTimelineDawSessionKeyboardCommand({ ...base, key: "n", ctrlKey: true })).toBeNull();
    expect(resolveTimelineDawSessionKeyboardCommand({ ...base, key: "n", repeat: true })).toBeNull();
  });

  it("maps number keys to the first nine visible scenes safely", () => {
    const base = { sceneCount: 5, launcherFocused: true, editableTarget: false };
    expect(resolveTimelineDawSessionSceneHotkeyIndex({ ...base, key: "1" })).toBe(0);
    expect(resolveTimelineDawSessionSceneHotkeyIndex({ ...base, key: "5" })).toBe(4);
    expect(resolveTimelineDawSessionSceneHotkeyIndex({ ...base, key: "6" })).toBeNull();
    expect(resolveTimelineDawSessionSceneHotkeyIndex({ ...base, key: "0" })).toBeNull();
    expect(resolveTimelineDawSessionSceneHotkeyIndex({ ...base, key: "1", editableTarget: true })).toBeNull();
    expect(resolveTimelineDawSessionSceneHotkeyIndex({ ...base, key: "1", altKey: true })).toBeNull();
    expect(resolveTimelineDawSessionSceneHotkeyIndex({ ...base, key: "1", repeat: true })).toBeNull();
  });

  it("builds one-shot and continuous individual clip launch plans", () => {
    expect(createTimelineDawSessionClipLaunchPlan("one-shot")).toEqual({ repeatCount: 1, loopForever: false });
    expect(createTimelineDawSessionClipLaunchPlan("loop")).toEqual({ repeatCount: 1, loopForever: true });
  });

  it("captures musical performance timestamps and builds a non-destructive arrangement plan", () => {
    const event = createTimelineDawSessionPerformanceEvent({
      id: "launch-1",
      kind: "scene",
      name: "Chorus",
      takeStartedAtMs: 1_000,
      launchedAtMs: 3_500,
      bpm: 120,
      clips: [
        { laneId: "drums", startSeconds: 8, endSeconds: 16 },
        { laneId: "bass", startSeconds: 10, endSeconds: 18 },
      ],
    });
    expect(event).toMatchObject({ elapsedSeconds: 2.5, bar: 2, beat: 2 });
    expect(createTimelineDawSessionArrangementPlan([event])).toEqual([
      { eventId: "launch-1", eventName: "Chorus", laneId: "drums", sourceStartSeconds: 8, sourceEndSeconds: 16, timelineStartSeconds: 2.5 },
      { eventId: "launch-1", eventName: "Chorus", laneId: "bass", sourceStartSeconds: 10, sourceEndSeconds: 18, timelineStartSeconds: 2.5 },
    ]);
  });

  it("tightens a captured take to a musical grid without mutating the live events", () => {
    const events = [
      createTimelineDawSessionPerformanceEvent({ id: "one", kind: "scene", name: "Verse", takeStartedAtMs: 0, launchedAtMs: 0, bpm: 120, clips: [{ laneId: "drums", startSeconds: 0, endSeconds: 8 }] }),
      createTimelineDawSessionPerformanceEvent({ id: "two", kind: "scene", name: "Chorus", takeStartedAtMs: 0, launchedAtMs: 1_740, bpm: 120, clips: [{ laneId: "drums", startSeconds: 8, endSeconds: 16 }] }),
    ];
    const tightened = quantizeTimelineDawSessionPerformanceTake(events, "bar");
    expect(tightened.map((event) => [event.elapsedSeconds, event.bar, event.beat])).toEqual([[0, 1, 1], [2, 2, 1]]);
    expect(events[1].elapsedSeconds).toBe(1.74);
    expect(tightened[1]).not.toBe(events[1]);
    expect(quantizeTimelineDawSessionPerformanceTake(events, "off")).toEqual(events);
  });

  it("ends earlier same-track placements when a later Session View clip takes over", () => {
    const events = [
      createTimelineDawSessionPerformanceEvent({ id: "verse", kind: "scene", name: "Verse", takeStartedAtMs: 0, launchedAtMs: 0, bpm: 120, clips: [{ laneId: "drums", startSeconds: 0, endSeconds: 8 }, { laneId: "bass", startSeconds: 4, endSeconds: 8 }] }),
      createTimelineDawSessionPerformanceEvent({ id: "chorus", kind: "scene", name: "Chorus", takeStartedAtMs: 0, launchedAtMs: 2_000, bpm: 120, clips: [{ laneId: "drums", startSeconds: 8, endSeconds: 16 }] }),
    ];
    expect(createTimelineDawSessionConsolidatedArrangementPlan(events)).toEqual([
      { eventId: "verse", eventName: "Verse", laneId: "bass", sourceStartSeconds: 4, sourceEndSeconds: 8, timelineStartSeconds: 0, timelineEndSeconds: 4 },
      { eventId: "verse", eventName: "Verse", laneId: "drums", sourceStartSeconds: 0, sourceEndSeconds: 2, timelineStartSeconds: 0, timelineEndSeconds: 2 },
      { eventId: "chorus", eventName: "Chorus", laneId: "drums", sourceStartSeconds: 8, sourceEndSeconds: 16, timelineStartSeconds: 2, timelineEndSeconds: 10 },
    ]);
    expect(events[0].clips[0].endSeconds).toBe(8);
  });

  it("builds a proportional lane-ordered arrangement timeline preview", () => {
    const preview = createTimelineDawSessionArrangementPreview([
      { eventId: "verse", eventName: "Verse", laneId: "bass", sourceStartSeconds: 0, sourceEndSeconds: 4, timelineStartSeconds: 0, timelineEndSeconds: 4 },
      { eventId: "chorus", eventName: "Chorus", laneId: "drums", sourceStartSeconds: 8, sourceEndSeconds: 16, timelineStartSeconds: 2, timelineEndSeconds: 10 },
    ], ["drums", "bass", "vocals"]);
    expect(preview.durationSeconds).toBe(10);
    expect(preview.lanes.map((lane) => [lane.laneId, lane.clips.length])).toEqual([["drums", 1], ["bass", 1], ["vocals", 0]]);
    expect(preview.lanes[0].clips[0]).toMatchObject({ leftPercent: 20, widthPercent: 80 });
    expect(preview.lanes[1].clips[0]).toMatchObject({ leftPercent: 0, widthPercent: 40 });
  });

  it("creates isolated named take-lane snapshots", () => {
    const event = createTimelineDawSessionPerformanceEvent({ id: "launch", kind: "scene", name: "Verse", takeStartedAtMs: 0, launchedAtMs: 500, bpm: 120, clips: [{ laneId: "drums", startSeconds: 0, endSeconds: 8 }] });
    const take = createTimelineDawSessionSavedTake({ id: "take-1", name: "  First pass  ", quantization: "beat", events: [event] });
    expect(take).toMatchObject({ id: "take-1", name: "First pass", quantization: "beat" });
    expect(take.events[0]).not.toBe(event);
    expect(take.events[0].clips[0]).not.toBe(event.clips[0]);
    take.events[0].clips[0].endSeconds = 4;
    expect(event.clips[0].endSeconds).toBe(8);
    expect(() => createTimelineDawSessionSavedTake({ id: "", name: "", quantization: "off", events: [] })).toThrow("needs an id");
  });

  it("summarizes take lanes with comparable musical arrangement metrics", () => {
    const take = createTimelineDawSessionSavedTake({ id: "take-a", name: "Take A", quantization: "bar", events: [
      createTimelineDawSessionPerformanceEvent({ id: "verse", kind: "scene", name: "Verse", takeStartedAtMs: 0, launchedAtMs: 0, bpm: 120, clips: [{ laneId: "drums", startSeconds: 0, endSeconds: 8 }, { laneId: "bass", startSeconds: 0, endSeconds: 8 }] }),
      createTimelineDawSessionPerformanceEvent({ id: "fill", kind: "clip", name: "Fill", takeStartedAtMs: 0, launchedAtMs: 1_800, bpm: 120, clips: [{ laneId: "drums", startSeconds: 8, endSeconds: 10 }] }),
    ] });
    expect(createTimelineDawSessionTakeSummary(take)).toEqual({
      id: "take-a", name: "Take A", launchCount: 2, sceneLaunchCount: 1, placementCount: 3, trackCount: 2, durationSeconds: 8, quantization: "bar",
    });
  });

  it("builds a sorted isolated comp from selected launches across take lanes", () => {
    const first = createTimelineDawSessionSavedTake({ id: "first", name: "First", quantization: "bar", events: [
      createTimelineDawSessionPerformanceEvent({ id: "chorus", kind: "scene", name: "Chorus", takeStartedAtMs: 0, launchedAtMs: 1_800, bpm: 120, clips: [{ laneId: "drums", startSeconds: 8, endSeconds: 16 }] }),
    ] });
    const second = createTimelineDawSessionSavedTake({ id: "second", name: "Second", quantization: "off", events: [
      createTimelineDawSessionPerformanceEvent({ id: "verse", kind: "scene", name: "Verse", takeStartedAtMs: 0, launchedAtMs: 0, bpm: 120, clips: [{ laneId: "bass", startSeconds: 0, endSeconds: 8 }] }),
    ] });
    const comp = createTimelineDawSessionCompTake({ id: "comp", name: "Best sections", takes: [first, second], selections: [{ takeId: "first", eventId: "chorus" }, { takeId: "second", eventId: "verse" }] });
    expect(comp.name).toBe("Best sections");
    expect(comp.quantization).toBe("off");
    expect(comp.events.map((event) => [event.name, event.elapsedSeconds])).toEqual([["Verse", 0], ["Chorus", 2]]);
    comp.events[0].clips[0].endSeconds = 4;
    expect(second.events[0].clips[0].endSeconds).toBe(8);
    expect(() => createTimelineDawSessionCompTake({ id: "empty", name: "Empty", takes: [first], selections: [] })).toThrow("at least one selected launch");
  });

  it("round-trips a strictly validated portable Take Lane bundle", () => {
    const take = createTimelineDawSessionSavedTake({ id: "take", name: "Portable", quantization: "beat", events: [
      createTimelineDawSessionPerformanceEvent({ id: "verse", kind: "scene", name: "Verse", takeStartedAtMs: 0, launchedAtMs: 500, bpm: 120, clips: [{ laneId: "drums", startSeconds: 0, endSeconds: 8 }] }),
    ] });
    const bundle = createTimelineDawSessionTakeLaneBundle({ createdAt: "2026-08-26T17:00:00.000Z", preferredTakeId: "take", takes: [take] });
    const restored = parseTimelineDawSessionTakeLaneBundle(JSON.parse(JSON.stringify(bundle)) as unknown);
    expect(restored).toEqual(bundle);
    expect(restored.takes[0]).not.toBe(take);
    expect(parseTimelineDawSessionTakeLaneBundle({ ...bundle, preferredTakeId: "missing" }).preferredTakeId).toBeNull();
    expect(() => parseTimelineDawSessionTakeLaneBundle({ ...bundle, schema: "unknown" })).toThrow("unsupported format");
    expect(() => parseTimelineDawSessionTakeLaneBundle({ ...bundle, takes: [{ ...take, events: [{ ...take.events[0], bpm: 500 }] }] })).toThrow("invalid launch fields");
  });

  it("reorders live scenes safely while preserving new and unknown scenes", () => {
    const scenes = [
      { id: "verse", name: "Verse", slots: [] },
      { id: "chorus", name: "Chorus", slots: [] },
      { id: "bridge", name: "Bridge", slots: [] },
    ];
    expect(moveTimelineDawSessionScene(scenes, [], "chorus", "up")).toEqual(["chorus", "verse", "bridge"]);
    expect(moveTimelineDawSessionScene(scenes, ["chorus", "verse", "bridge"], "chorus", "up")).toEqual(["chorus", "verse", "bridge"]);
    expect(orderTimelineDawSessionScenes(scenes, ["missing", "bridge", "bridge", "verse"]).map((scene) => scene.id)).toEqual(["bridge", "verse", "chorus"]);
  });

  it("resolves independent per-scene follow actions with a global fallback", () => {
    const choices = { verse: "next", chorus: "loop", bridge: "global" } as const;
    expect(resolveTimelineDawSessionSceneFollowAction("verse", choices, "stop")).toBe("next");
    expect(resolveTimelineDawSessionSceneFollowAction("chorus", choices, "stop")).toBe("loop");
    expect(resolveTimelineDawSessionSceneFollowAction("bridge", choices, "stop")).toBe("stop");
    expect(resolveTimelineDawSessionSceneFollowAction("outro", choices, "next")).toBe("next");
  });

  it("resolves bounded per-scene play counts before follow actions", () => {
    expect(resolveTimelineDawSessionScenePlayCount("verse", { verse: 4 })).toBe(4);
    expect(resolveTimelineDawSessionScenePlayCount("verse", { verse: 16 })).toBe(16);
    expect(resolveTimelineDawSessionScenePlayCount("verse", { verse: 0 })).toBe(1);
    expect(resolveTimelineDawSessionScenePlayCount("verse", { verse: 17 })).toBe(1);
    expect(resolveTimelineDawSessionScenePlayCount("verse", { verse: 2.5 })).toBe(1);
    expect(resolveTimelineDawSessionScenePlayCount("missing", { verse: 4 })).toBe(1);
  });

  it("resolves explicit follow targets with safe visible-order fallback", () => {
    const scenes = [
      { id: "verse", name: "Verse", slots: [] },
      { id: "chorus", name: "Chorus", slots: [] },
      { id: "bridge", name: "Bridge", slots: [] },
    ];
    expect(resolveTimelineDawSessionFollowTargetIndex(0, scenes, "bridge")).toBe(2);
    expect(resolveTimelineDawSessionFollowTargetIndex(1, scenes, "verse")).toBe(0);
    expect(resolveTimelineDawSessionFollowTargetIndex(0, scenes, "verse")).toBe(1);
    expect(resolveTimelineDawSessionFollowTargetIndex(1, scenes, "missing")).toBe(2);
    expect(resolveTimelineDawSessionFollowTargetIndex(2, scenes, "missing")).toBeNull();
    expect(resolveTimelineDawSessionFollowTargetIndex(-1, scenes, "verse")).toBeNull();
  });

  it("builds an exact live cue for the active scene transition", () => {
    const scenes = [
      { id: "verse", name: "Verse", slots: [] },
      { id: "chorus", name: "Chorus", slots: [] },
      { id: "bridge", name: "Bridge", slots: [] },
    ];
    expect(createTimelineDawSessionLiveCue(0, scenes, { verse: "next" }, { verse: "bridge" }, { verse: 4 })).toEqual({ sceneId: "verse", action: "next", playCount: 4, nextSceneId: "bridge" });
    expect(createTimelineDawSessionLiveCue(1, scenes, { chorus: "loop" }, {}, { chorus: 2 })).toEqual({ sceneId: "chorus", action: "loop", playCount: 2, nextSceneId: "chorus" });
    expect(createTimelineDawSessionLiveCue(2, scenes, { bridge: "stop" }, {}, {})).toEqual({ sceneId: "bridge", action: "stop", playCount: 1, nextSceneId: null });
    expect(createTimelineDawSessionLiveCue(1, scenes, { chorus: "next" }, { chorus: "missing" }, {})).toEqual({ sceneId: "chorus", action: "next", playCount: 1, nextSceneId: "bridge" });
    expect(createTimelineDawSessionLiveCue(-1, scenes, {}, {}, {})).toBeNull();
  });

  it("formats finite and open-ended live scene progress safely", () => {
    expect(createTimelineDawSessionLiveProgressLabel(2, 4)).toBe("Play 2 of 4 · 2 remaining");
    expect(createTimelineDawSessionLiveProgressLabel(5, 4)).toBe("Play 5 of 5 · 0 remaining");
    expect(createTimelineDawSessionLiveProgressLabel(3, null)).toBe("Loop pass 3");
    expect(createTimelineDawSessionLiveProgressLabel(0, 0)).toBe("Play 1 of 1 · 0 remaining");
  });

  it("calculates bounded live pass timing and visual progress", () => {
    expect(createTimelineDawSessionPassProgress(1_000, 8_000, 3_500)).toEqual({ elapsedSeconds: 2.5, remainingSeconds: 5.5, percent: 31 });
    expect(createTimelineDawSessionPassProgress(1_000, 8_000, 20_000)).toEqual({ elapsedSeconds: 8, remainingSeconds: 0, percent: 100 });
    expect(createTimelineDawSessionPassProgress(1_000, 8_000, 500)).toEqual({ elapsedSeconds: 0, remainingSeconds: 8, percent: 0 });
    expect(createTimelineDawSessionPassProgress(Number.NaN, 0, Number.NaN)).toEqual({ elapsedSeconds: 0, remainingSeconds: 0, percent: 0 });
  });

  it("round-trips a strictly allowlisted portable Live Set Plan", () => {
    const plan = createTimelineDawSessionLiveSetPlan({
      createdAt: "2026-08-26T18:00:00.000Z", bpm: 128, launchQuantization: "bar", defaultFollowAction: "next",
      sceneOrderIds: ["chorus", "verse", "chorus"], sceneFollowChoices: { chorus: "loop", verse: "global" }, scenePlayCounts: { chorus: 4, verse: 2 }, sceneFollowTargetIds: { verse: "chorus" },
    });
    expect(plan.sceneOrderIds).toEqual(["chorus", "verse"]);
    expect(parseTimelineDawSessionLiveSetPlan(JSON.parse(JSON.stringify(plan)) as unknown)).toEqual(plan);
    expect(() => parseTimelineDawSessionLiveSetPlan({ ...plan, bpm: 500 })).toThrow("between 30 and 300");
    expect(() => parseTimelineDawSessionLiveSetPlan({ ...plan, scenePlayCounts: { verse: 17 } })).toThrow("invalid scene play counts");
    expect(() => parseTimelineDawSessionLiveSetPlan({ ...plan, launchQuantization: "random" })).toThrow("invalid launch settings");
  });

  it("traces live-set routes and reports loops, endings, and unreachable scenes", () => {
    const scenes = [
      { id: "verse", name: "Verse", slots: [{ id: "v", laneId: "drums", name: "Verse", startSeconds: 0, endSeconds: 8, color: "cyan" as const }] },
      { id: "chorus", name: "Chorus", slots: [{ id: "c", laneId: "drums", name: "Chorus", startSeconds: 8, endSeconds: 12, color: "cyan" as const }] },
      { id: "bridge", name: "Bridge", slots: [{ id: "b", laneId: "drums", name: "Bridge", startSeconds: 12, endSeconds: 14, color: "cyan" as const }] },
      { id: "outro", name: "Outro", slots: [{ id: "o", laneId: "drums", name: "Outro", startSeconds: 14, endSeconds: 17, color: "cyan" as const }] },
    ];
    expect(analyzeTimelineDawSessionLiveSetFlow(scenes, { verse: "next", chorus: "next", bridge: "stop", outro: "stop" }, { verse: "chorus", chorus: "verse" }, { verse: 2 })).toEqual({ status: "loops", pathIds: ["verse", "chorus"], cycleAtSceneId: "verse", unreachableSceneIds: ["bridge", "outro"], schedule: [{ sceneId: "verse", playCount: 2, startSeconds: 0, endSeconds: 16 }, { sceneId: "chorus", playCount: 1, startSeconds: 16, endSeconds: 20 }], estimatedSourceDurationSeconds: null });
    expect(analyzeTimelineDawSessionLiveSetFlow(scenes, { verse: "next", chorus: "next", bridge: "next", outro: "stop" }, {})).toEqual({ status: "stops", pathIds: ["verse", "chorus", "bridge", "outro"], cycleAtSceneId: null, unreachableSceneIds: [], schedule: [{ sceneId: "verse", playCount: 1, startSeconds: 0, endSeconds: 8 }, { sceneId: "chorus", playCount: 1, startSeconds: 8, endSeconds: 12 }, { sceneId: "bridge", playCount: 1, startSeconds: 12, endSeconds: 14 }, { sceneId: "outro", playCount: 1, startSeconds: 14, endSeconds: 17 }], estimatedSourceDurationSeconds: 17 });
    expect(analyzeTimelineDawSessionLiveSetFlow([], {}, {}).status).toBe("empty");
  });

  it("uses the longest scene region and play count for source-time scheduling", () => {
    const scenes = [{ id: "layered", name: "Layered", slots: [
      { id: "short", laneId: "bass", name: "Layered", startSeconds: 0, endSeconds: 3, color: "cyan" as const },
      { id: "long", laneId: "drums", name: "Layered", startSeconds: 5, endSeconds: 11, color: "violet" as const },
    ] }];
    const flow = analyzeTimelineDawSessionLiveSetFlow(scenes, { layered: "stop" }, {}, { layered: 4 });
    expect(flow.schedule).toEqual([{ sceneId: "layered", playCount: 4, startSeconds: 0, endSeconds: 24 }]);
    expect(flow.estimatedSourceDurationSeconds).toBe(24);
  });
});
