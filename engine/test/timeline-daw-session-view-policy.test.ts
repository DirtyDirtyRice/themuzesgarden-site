import { describe, expect, it } from "vitest";
import { createTimelineDawSessionScenePassProgress } from "../../lib/timeline/TimelineDawSessionViewPolicy";
import { createTimelineDawSessionSceneRemainingLabel, createTimelineDawSessionSceneUpNextCue } from "../../lib/timeline/TimelineDawSessionViewPolicy";
import { createTimelineDawSessionMusicalPosition } from "../../lib/timeline/TimelineDawSessionViewPolicy";
import { createTimelineDawSessionTapTempo } from "../../lib/timeline/TimelineDawSessionViewPolicy";
import { adjustTimelineDawSessionTempo } from "../../lib/timeline/TimelineDawSessionViewPolicy";
import { isTimelineDawSessionTempoCommand } from "../../lib/timeline/TimelineDawSessionViewPolicy";
import { analyzeTimelineDawSessionLiveSetFlow, createTimelineDawSessionArrangementPlan, createTimelineDawSessionArrangementPreview, createTimelineDawSessionClipLaunchPlan, createTimelineDawSessionClipPassProgress, createTimelineDawSessionClipPlaybackStatus, createTimelineDawSessionClipRemainingLabel, createTimelineDawSessionClipTransportState, createTimelineDawSessionClipUpNextCue, createTimelineDawSessionCompTake, createTimelineDawSessionConsolidatedArrangementPlan, createTimelineDawSessionFollowIndex, createTimelineDawSessionLaunchDelay, createTimelineDawSessionLiveCue, createTimelineDawSessionLiveProgressLabel, createTimelineDawSessionLiveSetPlan, createTimelineDawSessionNavigationIndex, createTimelineDawSessionPassProgress, createTimelineDawSessionPerformanceEvent, createTimelineDawSessionQueuedLaunchProgress, createTimelineDawSessionQueuedStopLabel, createTimelineDawSessionSavedTake, createTimelineDawSessionSceneLaunch, createTimelineDawSessionScenes, createTimelineDawSessionTakeLaneBundle, createTimelineDawSessionTakeSummary, findTimelineDawSessionClipSlot, moveTimelineDawSessionScene, orderTimelineDawSessionScenes, parseTimelineDawSessionLiveSetPlan, parseTimelineDawSessionTakeLaneBundle, quantizeTimelineDawSessionPerformanceTake, resolveTimelineDawSessionClipKeyboardCommand, resolveTimelineDawSessionClipLaunchMode, resolveTimelineDawSessionClipPlayCount, resolveTimelineDawSessionClipQuantization, resolveTimelineDawSessionFollowTargetIndex, resolveTimelineDawSessionKeyboardCommand, resolveTimelineDawSessionSceneFollowAction, resolveTimelineDawSessionSceneHotkeyIndex, resolveTimelineDawSessionScenePlayCount } from "../../lib/timeline/TimelineDawSessionViewPolicy";

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
    expect(createTimelineDawSessionLaunchDelay({ playheadSeconds: 1.25, bpm: 120, quantization: "bar", beatsPerBar: 3 })).toBe(250);
    expect(createTimelineDawSessionLaunchDelay({ playheadSeconds: 3.25, bpm: 120, quantization: "bar", beatsPerBar: 7 })).toBe(250);
    expect(createTimelineDawSessionLaunchDelay({ playheadSeconds: 1.25, bpm: 120, quantization: "bar", beatsPerBar: 6, beatUnit: 8 })).toBe(250);
    expect(createTimelineDawSessionLaunchDelay({ playheadSeconds: 2, bpm: 120, quantization: "bar" })).toBe(0);
    expect(createTimelineDawSessionLaunchDelay({ playheadSeconds: 1.25, bpm: 120, quantization: "immediate" })).toBe(0);
    expect(() => createTimelineDawSessionLaunchDelay({ playheadSeconds: 1, bpm: 10, quantization: "bar" })).toThrow("between 30 and 300");
  });

  it("reports a bounded live countdown for queued launches", () => {
    expect(createTimelineDawSessionQueuedLaunchProgress(1_000, 750, 1_250)).toEqual({ elapsedSeconds: 0.3, remainingSeconds: 0.5, percent: 33 });
    expect(createTimelineDawSessionQueuedLaunchProgress(1_000, 750, 2_000)).toEqual({ elapsedSeconds: 0.8, remainingSeconds: 0, percent: 100 });
  });

  it("labels quantized stop boundaries clearly", () => {
    expect(createTimelineDawSessionQueuedStopLabel("bar")).toBe("Stop on Next Bar");
    expect(createTimelineDawSessionQueuedStopLabel("two-beats")).toBe("Stop on Next Two-Beat Boundary");
    expect(createTimelineDawSessionQueuedStopLabel("beat")).toBe("Stop on Next Beat");
    expect(createTimelineDawSessionQueuedStopLabel("immediate")).toBe("Stop Now");
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
    expect(resolveTimelineDawSessionKeyboardCommand({ ...base, key: "K" })).toBe("pause-resume");
    expect(resolveTimelineDawSessionKeyboardCommand({ ...base, key: "T" })).toBe("tap-tempo");
    expect(resolveTimelineDawSessionKeyboardCommand({ ...base, key: "[" })).toBe("tempo-down");
    expect(resolveTimelineDawSessionKeyboardCommand({ ...base, key: "]" })).toBe("tempo-up");
    expect(resolveTimelineDawSessionKeyboardCommand({ ...base, key: "{" })).toBe("tempo-half");
    expect(resolveTimelineDawSessionKeyboardCommand({ ...base, key: "}" })).toBe("tempo-double");
    expect(resolveTimelineDawSessionKeyboardCommand({ ...base, key: "\\" })).toBe("timing-lock");
    expect(resolveTimelineDawSessionKeyboardCommand({ ...base, key: "|" })).toBe("timing-recall");
    expect(resolveTimelineDawSessionKeyboardCommand({ ...base, key: "Backspace" })).toBe("timing-return");
    expect(resolveTimelineDawSessionKeyboardCommand({ ...base, key: "F6" })).toBe("timing-slot-a");
    expect(resolveTimelineDawSessionKeyboardCommand({ ...base, key: "F7" })).toBe("timing-slot-b");
    expect(resolveTimelineDawSessionKeyboardCommand({ ...base, key: "F8" })).toBe("timing-slot-c");
    expect(resolveTimelineDawSessionKeyboardCommand({ ...base, key: "F9" })).toBe("timing-capture");
    expect(resolveTimelineDawSessionKeyboardCommand({ ...base, key: "F10" })).toBe("timing-recall");
    expect(resolveTimelineDawSessionKeyboardCommand({ ...base, key: "Q" })).toBe("queue-stop");
    expect(resolveTimelineDawSessionKeyboardCommand({ ...base, key: "Enter" })).toBe("launch-queued");
    expect(resolveTimelineDawSessionKeyboardCommand({ ...base, key: "Escape" })).toBe("cancel-queued");
    expect(resolveTimelineDawSessionKeyboardCommand({ ...base, key: " " })).toBe("stop");
    expect(resolveTimelineDawSessionKeyboardCommand({ ...base, key: "n", editableTarget: true })).toBeNull();
    expect(resolveTimelineDawSessionKeyboardCommand({ ...base, key: "n", launcherFocused: false })).toBeNull();
    expect(resolveTimelineDawSessionKeyboardCommand({ ...base, key: "n", ctrlKey: true })).toBeNull();
    expect(resolveTimelineDawSessionKeyboardCommand({ ...base, key: "n", repeat: true })).toBeNull();
    expect(resolveTimelineDawSessionKeyboardCommand({ ...base, key: "t", repeat: true })).toBeNull();
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
    expect(createTimelineDawSessionClipLaunchPlan("one-shot", 4)).toEqual({ repeatCount: 4, loopForever: false });
    expect(createTimelineDawSessionClipLaunchPlan("loop")).toEqual({ repeatCount: 1, loopForever: true });
    expect(createTimelineDawSessionClipLaunchPlan("one-shot", 20)).toEqual({ repeatCount: 1, loopForever: false });
  });

  it("resolves bounded per-clip play counts", () => {
    expect(resolveTimelineDawSessionClipPlayCount("verse", { verse: 4 })).toBe(4);
    expect(resolveTimelineDawSessionClipPlayCount("verse", { verse: 0 })).toBe(1);
    expect(resolveTimelineDawSessionClipPlayCount("verse", { verse: 17 })).toBe(1);
    expect(resolveTimelineDawSessionClipPlayCount("missing", { verse: 4 })).toBe(1);
  });

  it("finds an active clip safely across visible scenes", () => {
    const scenes = [
      { id: "verse", name: "Verse", slots: [{ id: "clip-a", laneId: "guitar", name: "Verse", startSeconds: 0, endSeconds: 8, color: "cyan" as const }] },
      { id: "chorus", name: "Chorus", slots: [{ id: "clip-b", laneId: "drums", name: "Chorus", startSeconds: 8, endSeconds: 16, color: "cyan" as const }] },
    ];
    expect(findTimelineDawSessionClipSlot(scenes, "clip-b")?.name).toBe("Chorus");
    expect(findTimelineDawSessionClipSlot(scenes, "missing")).toBeNull();
    expect(findTimelineDawSessionClipSlot(scenes)).toBeNull();
  });

  it("describes finite, looping, and paused individual clip playback", () => {
    expect(createTimelineDawSessionClipPlaybackStatus({ mode: "one-shot", currentPass: 2, totalPasses: 4 })).toBe("Playing · pass 2 of 4");
    expect(createTimelineDawSessionClipPlaybackStatus({ mode: "one-shot", currentPass: 2, totalPasses: 4, paused: true })).toBe("Paused · pass 2 of 4");
    expect(createTimelineDawSessionClipPlaybackStatus({ mode: "loop" })).toBe("Playing · continuous loop");
    expect(createTimelineDawSessionClipPlaybackStatus({ mode: "loop", paused: true })).toBe("Paused · continuous loop");
    expect(createTimelineDawSessionClipPlaybackStatus({ mode: "one-shot", currentPass: 0, totalPasses: 0 })).toBe("Playing · pass 1 of 1");
  });

  it("provides safe individual clip pass navigation", () => {
    expect(createTimelineDawSessionClipTransportState({ mode: "one-shot", currentPass: 1, totalPasses: 4 })).toEqual({ canGoPrevious: false, advanceLabel: "Next Pass" });
    expect(createTimelineDawSessionClipTransportState({ mode: "one-shot", currentPass: 2, totalPasses: 4 })).toEqual({ canGoPrevious: true, advanceLabel: "Next Pass" });
    expect(createTimelineDawSessionClipTransportState({ mode: "one-shot", currentPass: 4, totalPasses: 4 })).toEqual({ canGoPrevious: true, advanceLabel: "Finish Clip" });
    expect(createTimelineDawSessionClipTransportState({ mode: "loop", currentPass: 9, totalPasses: 9 })).toEqual({ canGoPrevious: false, advanceLabel: "Restart Loop" });
    expect(createTimelineDawSessionClipTransportState({ mode: "one-shot", currentPass: 0, totalPasses: 0 })).toEqual({ canGoPrevious: false, advanceLabel: "Finish Clip" });
  });

  it("previews the next individual clip transport outcome", () => {
    expect(createTimelineDawSessionClipUpNextCue({ mode: "one-shot", currentPass: 2, totalPasses: 4 })).toBe("Pass 3 of 4");
    expect(createTimelineDawSessionClipUpNextCue({ mode: "one-shot", currentPass: 4, totalPasses: 4 })).toBe("Clip stops at pass end");
    expect(createTimelineDawSessionClipUpNextCue({ mode: "loop" })).toBe("Loop restarts at pass end");
    expect(createTimelineDawSessionClipUpNextCue({ mode: "one-shot", currentPass: 0, totalPasses: 0 })).toBe("Clip stops at pass end");
  });

  it("calculates total remaining time across finite clip passes", () => {
    expect(createTimelineDawSessionClipRemainingLabel({ mode: "one-shot", currentPass: 2, totalPasses: 4, passDurationSeconds: 8, currentPassRemainingSeconds: 5.5 })).toBe("Total remaining: 21.5 sec");
    expect(createTimelineDawSessionClipRemainingLabel({ mode: "one-shot", currentPass: 4, totalPasses: 4, passDurationSeconds: 8, currentPassRemainingSeconds: 2.25 })).toBe("Total remaining: 2.3 sec");
    expect(createTimelineDawSessionClipRemainingLabel({ mode: "loop", passDurationSeconds: 8, currentPassRemainingSeconds: 2 })).toBe("Total remaining: open-ended loop");
    expect(createTimelineDawSessionClipRemainingLabel({ mode: "one-shot", currentPass: 0, totalPasses: 0, passDurationSeconds: -1, currentPassRemainingSeconds: 99 })).toBe("Total remaining: 0.0 sec");
  });

  it("routes focused performance shortcuts to an active individual clip safely", () => {
    expect(resolveTimelineDawSessionClipKeyboardCommand("previous", true, true)).toBe("previous");
    expect(resolveTimelineDawSessionClipKeyboardCommand("previous", true, false)).toBeNull();
    expect(resolveTimelineDawSessionClipKeyboardCommand("replay", true, false)).toBe("replay");
    expect(resolveTimelineDawSessionClipKeyboardCommand("next", true, false)).toBe("next");
    expect(resolveTimelineDawSessionClipKeyboardCommand("stop", true, true)).toBeNull();
    expect(resolveTimelineDawSessionClipKeyboardCommand("replay", false, true)).toBeNull();
  });

  it("routes pause and resume only when an individual clip is active", () => {
    expect(resolveTimelineDawSessionClipKeyboardCommand("pause-resume", true, false)).toBe("pause-resume");
    expect(resolveTimelineDawSessionClipKeyboardCommand("pause-resume", false, true)).toBeNull();
  });

  it("keeps queued-launch overrides out of individual clip navigation", () => {
    expect(resolveTimelineDawSessionClipKeyboardCommand("launch-queued", true, true)).toBeNull();
    expect(resolveTimelineDawSessionClipKeyboardCommand("cancel-queued", true, true)).toBeNull();
  });

  it("keeps quantized stop scheduling out of individual clip navigation", () => {
    expect(resolveTimelineDawSessionClipKeyboardCommand("queue-stop", true, true)).toBeNull();
    expect(resolveTimelineDawSessionKeyboardCommand({ key: "q", launcherFocused: true, editableTarget: true })).toBeNull();
  });

  it("keeps tap tempo out of individual clip pass navigation", () => {
    expect(resolveTimelineDawSessionClipKeyboardCommand("tap-tempo", true, true)).toBeNull();
  });

  it("keeps keyboard tempo nudging out of individual clip pass navigation", () => {
    expect(resolveTimelineDawSessionClipKeyboardCommand("tempo-down", true, true)).toBeNull();
    expect(resolveTimelineDawSessionClipKeyboardCommand("tempo-up", true, true)).toBeNull();
    expect(resolveTimelineDawSessionKeyboardCommand({ key: "[", launcherFocused: true, editableTarget: true })).toBeNull();
    expect(resolveTimelineDawSessionKeyboardCommand({ key: "]", launcherFocused: true, editableTarget: false, repeat: true })).toBeNull();
  });

  it("keeps keyboard half and double tempo out of clip pass navigation", () => {
    expect(resolveTimelineDawSessionClipKeyboardCommand("tempo-half", true, true)).toBeNull();
    expect(resolveTimelineDawSessionClipKeyboardCommand("tempo-double", true, true)).toBeNull();
    expect(resolveTimelineDawSessionKeyboardCommand({ key: "{", launcherFocused: true, editableTarget: true })).toBeNull();
    expect(resolveTimelineDawSessionKeyboardCommand({ key: "}", launcherFocused: true, editableTarget: false, repeat: true })).toBeNull();
  });

  it("identifies only tempo-changing performance commands for Tempo Lock", () => {
    expect(["tap-tempo", "tempo-down", "tempo-up", "tempo-half", "tempo-double"].every((command) => isTimelineDawSessionTempoCommand(command as never))).toBe(true);
    expect(isTimelineDawSessionTempoCommand("pause-resume")).toBe(false);
    expect(isTimelineDawSessionTempoCommand("queue-stop")).toBe(false);
    expect(isTimelineDawSessionTempoCommand("stop")).toBe(false);
  });

  it("keeps the timing lock shortcut focused, repeat-safe, and outside clip navigation", () => {
    const base = { key: "\\", launcherFocused: true, editableTarget: false };
    expect(resolveTimelineDawSessionKeyboardCommand(base)).toBe("timing-lock");
    expect(resolveTimelineDawSessionKeyboardCommand({ ...base, repeat: true })).toBeNull();
    expect(resolveTimelineDawSessionKeyboardCommand({ ...base, editableTarget: true })).toBeNull();
    expect(resolveTimelineDawSessionClipKeyboardCommand("timing-lock", true, true)).toBeNull();
    expect(isTimelineDawSessionTempoCommand("timing-lock")).toBe(false);
  });

  it("keeps timing snapshot recall focused, repeat-safe, and outside clip navigation", () => {
    const base = { key: "|", launcherFocused: true, editableTarget: false };
    expect(resolveTimelineDawSessionKeyboardCommand(base)).toBe("timing-recall");
    expect(resolveTimelineDawSessionKeyboardCommand({ ...base, repeat: true })).toBeNull();
    expect(resolveTimelineDawSessionKeyboardCommand({ ...base, editableTarget: true })).toBeNull();
    expect(resolveTimelineDawSessionClipKeyboardCommand("timing-recall", true, true)).toBeNull();
    expect(isTimelineDawSessionTempoCommand("timing-recall")).toBe(false);
  });

  it("keeps reversible timing return focused, repeat-safe, and outside clip navigation", () => {
    const base = { key: "Backspace", launcherFocused: true, editableTarget: false };
    expect(resolveTimelineDawSessionKeyboardCommand(base)).toBe("timing-return");
    expect(resolveTimelineDawSessionKeyboardCommand({ ...base, repeat: true })).toBeNull();
    expect(resolveTimelineDawSessionKeyboardCommand({ ...base, editableTarget: true })).toBeNull();
    expect(resolveTimelineDawSessionClipKeyboardCommand("timing-return", true, true)).toBeNull();
    expect(isTimelineDawSessionTempoCommand("timing-return")).toBe(false);
  });

  it("selects timing-bank slots with focused, repeat-safe function keys", () => {
    const base = { launcherFocused: true, editableTarget: false };
    expect(["F6", "F7", "F8"].map((key) => resolveTimelineDawSessionKeyboardCommand({ ...base, key }))).toEqual(["timing-slot-a", "timing-slot-b", "timing-slot-c"]);
    expect(resolveTimelineDawSessionKeyboardCommand({ ...base, key: "F6", repeat: true })).toBeNull();
    expect(resolveTimelineDawSessionKeyboardCommand({ ...base, key: "F7", editableTarget: true })).toBeNull();
    expect(resolveTimelineDawSessionClipKeyboardCommand("timing-slot-c", true, true)).toBeNull();
    expect(isTimelineDawSessionTempoCommand("timing-slot-a")).toBe(false);
  });

  it("captures the selected timing slot with a focused, repeat-safe F9 command", () => {
    const base = { key: "F9", launcherFocused: true, editableTarget: false };
    expect(resolveTimelineDawSessionKeyboardCommand(base)).toBe("timing-capture");
    expect(resolveTimelineDawSessionKeyboardCommand({ ...base, repeat: true })).toBeNull();
    expect(resolveTimelineDawSessionKeyboardCommand({ ...base, editableTarget: true })).toBeNull();
    expect(resolveTimelineDawSessionClipKeyboardCommand("timing-capture", true, true)).toBeNull();
    expect(isTimelineDawSessionTempoCommand("timing-capture")).toBe(false);
  });

  it("recalls the selected timing slot with a focused, repeat-safe F10 command", () => {
    const base = { key: "F10", launcherFocused: true, editableTarget: false };
    expect(resolveTimelineDawSessionKeyboardCommand(base)).toBe("timing-recall");
    expect(resolveTimelineDawSessionKeyboardCommand({ ...base, repeat: true })).toBeNull();
    expect(resolveTimelineDawSessionKeyboardCommand({ ...base, editableTarget: true })).toBeNull();
  });

  it("resolves independent per-clip launch modes with a global fallback", () => {
    const choices = { verse: "loop", chorus: "one-shot", bridge: "global" } as const;
    expect(resolveTimelineDawSessionClipLaunchMode("verse", choices, "one-shot")).toBe("loop");
    expect(resolveTimelineDawSessionClipLaunchMode("chorus", choices, "loop")).toBe("one-shot");
    expect(resolveTimelineDawSessionClipLaunchMode("bridge", choices, "loop")).toBe("loop");
    expect(resolveTimelineDawSessionClipLaunchMode("outro", choices, "one-shot")).toBe("one-shot");
  });

  it("resolves independent per-clip quantization with a global fallback", () => {
    const choices = { verse: "immediate", chorus: "beat", bridge: "global" } as const;
    expect(resolveTimelineDawSessionClipQuantization("verse", choices, "bar")).toBe("immediate");
    expect(resolveTimelineDawSessionClipQuantization("chorus", choices, "bar")).toBe("beat");
    expect(resolveTimelineDawSessionClipQuantization("bridge", choices, "two-beats")).toBe("two-beats");
    expect(resolveTimelineDawSessionClipQuantization("outro", choices, "bar")).toBe("bar");
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

  it("freezes individual clip pass progress at the pause time", () => {
    expect(createTimelineDawSessionClipPassProgress({ passStartedAtMs: 1_000, passDurationMs: 8_000, nowMs: 7_000, pausedAtMs: 3_500 })).toEqual({ elapsedSeconds: 2.5, remainingSeconds: 5.5, percent: 31 });
    expect(createTimelineDawSessionClipPassProgress({ passStartedAtMs: 1_000, passDurationMs: 8_000, nowMs: 3_500 })).toEqual({ elapsedSeconds: 2.5, remainingSeconds: 5.5, percent: 31 });
  });

  it("freezes a full scene pass at the pause time until playback resumes", () => {
    expect(createTimelineDawSessionScenePassProgress({ passStartedAtMs: 1_000, passDurationMs: 8_000, nowMs: 7_000, pausedAtMs: 3_500 })).toEqual({ elapsedSeconds: 2.5, remainingSeconds: 5.5, percent: 31 });
    expect(createTimelineDawSessionScenePassProgress({ passStartedAtMs: 1_000, passDurationMs: 8_000, nowMs: 3_500 })).toEqual({ elapsedSeconds: 2.5, remainingSeconds: 5.5, percent: 31 });
  });

  it("previews the next full-scene outcome and finite remaining time", () => {
    expect(createTimelineDawSessionSceneUpNextCue({ currentIteration: 2, totalIterations: 4, followAction: "next", nextSceneName: "Chorus" })).toBe("Pass 3 of 4");
    expect(createTimelineDawSessionSceneUpNextCue({ currentIteration: 4, totalIterations: 4, followAction: "next", nextSceneName: "Chorus" })).toBe("Launch Chorus");
    expect(createTimelineDawSessionSceneUpNextCue({ currentIteration: 1, totalIterations: 1, followAction: "stop" })).toBe("Scene stops at pass end");
    expect(createTimelineDawSessionSceneUpNextCue({ currentIteration: 7, totalIterations: null, followAction: "loop" })).toBe("Scene loops at pass end");
    expect(createTimelineDawSessionSceneRemainingLabel({ currentIteration: 2, totalIterations: 4, passDurationSeconds: 8, currentPassRemainingSeconds: 5.5 })).toBe("Total remaining: 21.5 sec");
    expect(createTimelineDawSessionSceneRemainingLabel({ currentIteration: 2, totalIterations: null, passDurationSeconds: 8, currentPassRemainingSeconds: 5.5 })).toBe("Total remaining: open-ended loop");
  });

  it("reports a bounded live bar and beat position for scene playback", () => {
    expect(createTimelineDawSessionMusicalPosition(0, 120)).toEqual({ bar: 1, beat: 1, beatProgressPercent: 0 });
    expect(createTimelineDawSessionMusicalPosition(1.25, 120)).toEqual({ bar: 1, beat: 3, beatProgressPercent: 50 });
    expect(createTimelineDawSessionMusicalPosition(2, 120)).toEqual({ bar: 2, beat: 1, beatProgressPercent: 0 });
    expect(createTimelineDawSessionMusicalPosition(3, 60, 3)).toEqual({ bar: 2, beat: 1, beatProgressPercent: 0 });
    expect(createTimelineDawSessionMusicalPosition(1.5, 120, 6, 8)).toEqual({ bar: 2, beat: 1, beatProgressPercent: 0 });
    expect(createTimelineDawSessionMusicalPosition(Number.NaN, 500, 0)).toEqual({ bar: 1, beat: 1, beatProgressPercent: 0 });
  });

  it("averages recent tap-tempo intervals within the supported BPM range", () => {
    expect(createTimelineDawSessionTapTempo([0])).toBeNull();
    expect(createTimelineDawSessionTapTempo([0, 500, 1_000, 1_500])).toBe(120);
    expect(createTimelineDawSessionTapTempo([0, 600, 1_100, 1_650])).toBe(109);
    expect(createTimelineDawSessionTapTempo([0, 100])).toBeNull();
    expect(createTimelineDawSessionTapTempo([0, 3_000])).toBeNull();
    expect(createTimelineDawSessionTapTempo([Number.NaN, 0, 250])).toBe(240);
  });

  it("nudges, halves, and doubles Session tempo within safe limits", () => {
    expect(adjustTimelineDawSessionTempo(120, "decrease")).toBe(119);
    expect(adjustTimelineDawSessionTempo(120, "increase")).toBe(121);
    expect(adjustTimelineDawSessionTempo(121, "half")).toBe(61);
    expect(adjustTimelineDawSessionTempo(121, "double")).toBe(242);
    expect(adjustTimelineDawSessionTempo(30, "decrease")).toBe(30);
    expect(adjustTimelineDawSessionTempo(200, "double")).toBe(300);
    expect(adjustTimelineDawSessionTempo(Number.NaN, "increase")).toBe(121);
  });

  it("round-trips a strictly allowlisted portable Live Set Plan", () => {
    const plan = createTimelineDawSessionLiveSetPlan({
      createdAt: "2026-08-26T18:00:00.000Z", bpm: 128, beatsPerBar: 7, beatUnit: 8, launchQuantization: "bar", defaultFollowAction: "next",
      defaultClipLaunchMode: "loop", clipLaunchChoices: { "verse:drums": "one-shot" }, clipQuantizationChoices: { "verse:drums": "beat" }, clipPlayCounts: { "verse:drums": 4 },
      sceneOrderIds: ["chorus", "verse", "chorus"], sceneFollowChoices: { chorus: "loop", verse: "global" }, scenePlayCounts: { chorus: 4, verse: 2 }, sceneFollowTargetIds: { verse: "chorus" },
    });
    expect(plan.sceneOrderIds).toEqual(["chorus", "verse"]);
    expect(parseTimelineDawSessionLiveSetPlan(JSON.parse(JSON.stringify(plan)) as unknown)).toEqual(plan);
    expect(() => parseTimelineDawSessionLiveSetPlan({ ...plan, bpm: 500 })).toThrow("between 30 and 300");
    expect(() => parseTimelineDawSessionLiveSetPlan({ ...plan, beatsPerBar: 13 })).toThrow("2 through 12");
    expect(() => parseTimelineDawSessionLiveSetPlan({ ...plan, beatUnit: 3 })).toThrow("4, 8, or 16");
    expect(() => parseTimelineDawSessionLiveSetPlan({ ...plan, scenePlayCounts: { verse: 17 } })).toThrow("invalid scene play counts");
    expect(() => parseTimelineDawSessionLiveSetPlan({ ...plan, launchQuantization: "random" })).toThrow("invalid launch settings");
    expect(() => parseTimelineDawSessionLiveSetPlan({ ...plan, clipLaunchChoices: { verse: "random" } })).toThrow("invalid clip launch choices");
    expect(() => parseTimelineDawSessionLiveSetPlan({ ...plan, clipQuantizationChoices: { verse: "random" } })).toThrow("invalid clip quantization choices");
    expect(() => parseTimelineDawSessionLiveSetPlan({ ...plan, clipPlayCounts: { verse: 17 } })).toThrow("invalid clip play counts");
    const legacyV3 = Object.fromEntries(Object.entries(plan).filter(([key]) => key !== "beatUnit"));
    expect(parseTimelineDawSessionLiveSetPlan({ ...legacyV3, schema: "muzes-daw-session-live-set/v3" })).toMatchObject({ schema: "muzes-daw-session-live-set/v4", beatsPerBar: 7, beatUnit: 4, defaultClipLaunchMode: "loop" });
    const legacyV2 = Object.fromEntries(Object.entries(plan).filter(([key]) => !["beatsPerBar", "beatUnit"].includes(key)));
    expect(parseTimelineDawSessionLiveSetPlan({ ...legacyV2, schema: "muzes-daw-session-live-set/v2" })).toMatchObject({ schema: "muzes-daw-session-live-set/v4", beatsPerBar: 4, beatUnit: 4, defaultClipLaunchMode: "loop" });
    const legacyV1 = Object.fromEntries(Object.entries(plan).filter(([key]) => !["beatsPerBar", "defaultClipLaunchMode", "clipLaunchChoices", "clipQuantizationChoices", "clipPlayCounts"].includes(key)));
    expect(parseTimelineDawSessionLiveSetPlan({ ...legacyV1, schema: "muzes-daw-session-live-set/v1" })).toMatchObject({ schema: "muzes-daw-session-live-set/v4", beatsPerBar: 4, beatUnit: 4, defaultClipLaunchMode: "one-shot", clipLaunchChoices: {}, clipQuantizationChoices: {}, clipPlayCounts: {} });
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
