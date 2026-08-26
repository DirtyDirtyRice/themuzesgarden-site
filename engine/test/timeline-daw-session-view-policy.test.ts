import { describe, expect, it } from "vitest";
import { createTimelineDawSessionFollowIndex, createTimelineDawSessionLaunchDelay, createTimelineDawSessionNavigationIndex, createTimelineDawSessionSceneLaunch, createTimelineDawSessionScenes, resolveTimelineDawSessionKeyboardCommand } from "../../lib/timeline/TimelineDawSessionViewPolicy";

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
});
