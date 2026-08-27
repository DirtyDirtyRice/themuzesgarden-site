import { describe, expect, it } from "vitest";
import { copyTimelineDawTrackFolderSend, createTimelineDawTrackFolderSendDryCheck, createTimelineDawTrackFolderSendFocusCheck, cycleTimelineDawTrackFolderSendFocus, jumpTimelineDawTrackFolderSendFocus, parseTimelineDawTrackFolderRouting, parseTimelineDawTrackFolderSend, resolveTimelineDawTrackFolderSendDestinations, resolveTimelineDawTrackFolderSendRemoval, restoreTimelineDawTrackFolderSendDryCheck, switchTimelineDawTrackFolderSendFocus, timelineDawTrackFolderSendDbToLevel, timelineDawTrackFolderSendLevelToDb, toggleTimelineDawTrackFolderSendFocusReference, updateTimelineDawTrackFolderSend } from "../../lib/timeline/TimelineDawTrackFolderRoutingPolicy";

describe("DAW track folder routing policy", () => {
  it("deduplicates a bounded folder assignment", () => {
    expect(parseTimelineDawTrackFolderRouting({ laneIds: [" a ", "b", "a"], busId: " bus-1 " })).toEqual({ laneIds: ["a", "b"], busId: "bus-1" });
    expect(() => parseTimelineDawTrackFolderRouting({ laneIds: ["a"], busId: null })).toThrow(/between 2 and 500/);
  });

  it("creates a post-fader bus send and rejects a feedback self-route", () => {
    expect(parseTimelineDawTrackFolderSend("bus-1", "bus-2")).toEqual({ sourceKind: "bus", sourceId: "bus-1", destinationBusId: "bus-2", level: 0.5, preFader: false, muted: false });
    expect(() => parseTimelineDawTrackFolderSend("bus-1", "bus-1")).toThrow(/different buses/);
  });

  it("updates a shared bus send without changing its route", () => {
    const send = { id: "send-1", sourceKind: "bus" as const, sourceId: "bus-1", destinationBusId: "bus-2", level: 0.5, preFader: false, muted: false };
    expect(updateTimelineDawTrackFolderSend(send, { level: 0.75, preFader: true, muted: true })).toEqual({ ...send, level: 0.75, preFader: true, muted: true });
    expect(() => updateTimelineDawTrackFolderSend(send, { level: 2.1 })).toThrow(/between 0 and 2/);
    expect(() => updateTimelineDawTrackFolderSend({ ...send, sourceKind: "lane" }, { muted: true })).toThrow(/shared bus/);
  });

  it("offers only new destinations that cannot feed back into the folder bus", () => {
    const sends = [
      { sourceKind: "bus" as const, sourceId: "folder", destinationBusId: "room", muted: false },
      { sourceKind: "bus" as const, sourceId: "return", destinationBusId: "folder", muted: false },
      { sourceKind: "bus" as const, sourceId: "deep", destinationBusId: "return", muted: false },
      { sourceKind: "lane" as const, sourceId: "lane-1", destinationBusId: "folder", muted: false },
    ];
    expect(resolveTimelineDawTrackFolderSendDestinations("folder", ["folder", "room", "safe", "return", "deep", "safe"], sends)).toEqual(["safe"]);
    expect(resolveTimelineDawTrackFolderSendDestinations("folder", ["return"], sends.map((send) => ({ ...send, muted: true })))).toEqual(["return"]);
  });

  it("copies a folder send mix to a different destination without copying its identity", () => {
    const send = { id: "send-1", sourceKind: "bus" as const, sourceId: "folder", destinationBusId: "room", level: 0.72, preFader: true, muted: false };
    expect(copyTimelineDawTrackFolderSend(send, " delay ")).toEqual({ sourceKind: "bus", sourceId: "folder", destinationBusId: "delay", level: 0.72, preFader: true, muted: false });
    expect(() => copyTimelineDawTrackFolderSend(send, "folder")).toThrow(/different destination/);
    expect(() => copyTimelineDawTrackFolderSend({ ...send, sourceKind: "lane" }, "delay")).toThrow(/shared bus/);
  });

  it("requires the same folder send twice inside an unexpired removal window", () => {
    expect(resolveTimelineDawTrackFolderSendRemoval(undefined, "send-1", 1_000)).toBe("confirm");
    expect(resolveTimelineDawTrackFolderSendRemoval({ sendId: "send-2", expiresAt: 2_000 }, "send-1", 1_000)).toBe("confirm");
    expect(resolveTimelineDawTrackFolderSendRemoval({ sendId: "send-1", expiresAt: 2_000 }, "send-1", 1_999)).toBe("remove");
    expect(resolveTimelineDawTrackFolderSendRemoval({ sendId: "send-1", expiresAt: 2_000 }, "send-1", 2_000)).toBe("confirm");
    expect(() => resolveTimelineDawTrackFolderSendRemoval(undefined, " ", 1_000)).toThrow(/identifier/);
  });

  it("converts folder send levels to professional decibel values", () => {
    expect(timelineDawTrackFolderSendLevelToDb(0)).toBeNull();
    expect(timelineDawTrackFolderSendLevelToDb(0.5)).toBeCloseTo(-6.0206);
    expect(timelineDawTrackFolderSendLevelToDb(1)).toBeCloseTo(0);
    expect(timelineDawTrackFolderSendDbToLevel(-60)).toBe(0);
    expect(timelineDawTrackFolderSendDbToLevel(-6.0206)).toBeCloseTo(0.5);
    expect(timelineDawTrackFolderSendDbToLevel(0)).toBe(1);
    expect(() => timelineDawTrackFolderSendDbToLevel(7)).toThrow(/6.02/);
  });

  it("temporarily dries one folder and restores every prior send mute state", () => {
    const sends = [
      { id: "room", sourceKind: "bus" as const, sourceId: "folder", muted: false },
      { id: "delay", sourceKind: "bus" as const, sourceId: "folder", muted: true },
      { id: "other", sourceKind: "bus" as const, sourceId: "other-folder", muted: false },
      { id: "lane", sourceKind: "lane" as const, sourceId: "lane-1", muted: false },
    ];
    const dry = createTimelineDawTrackFolderSendDryCheck(sends, "folder");
    expect(dry.snapshot).toEqual({ room: false, delay: true });
    expect(dry.sends.map((send) => send.muted)).toEqual([true, true, false, false]);
    expect(restoreTimelineDawTrackFolderSendDryCheck(dry.sends, dry.snapshot)).toEqual(sends);
    expect(() => createTimelineDawTrackFolderSendDryCheck(sends, "missing")).toThrow(/at least one/);
  });

  it("focuses one folder send and restores the complete prior send state", () => {
    const sends = [
      { id: "room", sourceKind: "bus" as const, sourceId: "folder", muted: false },
      { id: "delay", sourceKind: "bus" as const, sourceId: "folder", muted: true },
      { id: "other", sourceKind: "bus" as const, sourceId: "other-folder", muted: false },
    ];
    const focused = createTimelineDawTrackFolderSendFocusCheck(sends, "folder", "delay");
    expect(focused.snapshot).toEqual({ room: false, delay: true });
    expect(focused.focusedSendId).toBe("delay");
    expect(focused.sends.map((send) => send.muted)).toEqual([true, false, false]);
    expect(restoreTimelineDawTrackFolderSendDryCheck(focused.sends, focused.snapshot)).toEqual(sends);
    expect(() => createTimelineDawTrackFolderSendFocusCheck(sends, "folder", "other")).toThrow(/belong/);
  });

  it("switches focused audition without replacing its original restoration snapshot", () => {
    const sends = [
      { id: "room", sourceKind: "bus" as const, sourceId: "folder", muted: false },
      { id: "delay", sourceKind: "bus" as const, sourceId: "folder", muted: true },
      { id: "other", sourceKind: "bus" as const, sourceId: "other-folder", muted: false },
    ];
    const first = createTimelineDawTrackFolderSendFocusCheck(sends, "folder", "room");
    const switched = switchTimelineDawTrackFolderSendFocus(first.sends, "folder", "delay");
    expect(switched.map((send) => send.muted)).toEqual([true, false, false]);
    expect(restoreTimelineDawTrackFolderSendDryCheck(switched, first.snapshot)).toEqual(sends);
    expect(() => switchTimelineDawTrackFolderSendFocus(first.sends, "folder", "other")).toThrow(/belong/);
  });

  it("cycles focused folder sends in both directions with wraparound", () => {
    const sends = [
      { id: "room", sourceKind: "bus" as const, sourceId: "folder", muted: false },
      { id: "delay", sourceKind: "bus" as const, sourceId: "folder", muted: true },
      { id: "cue", sourceKind: "bus" as const, sourceId: "folder", muted: false },
      { id: "other", sourceKind: "bus" as const, sourceId: "other-folder", muted: false },
    ];
    const next = cycleTimelineDawTrackFolderSendFocus(sends, "folder", "room", 1);
    expect(next.focusedSendId).toBe("delay");
    expect(next.sends.map((send) => send.muted)).toEqual([true, false, true, false]);
    const previous = cycleTimelineDawTrackFolderSendFocus(next.sends, "folder", "delay", -1);
    expect(previous.focusedSendId).toBe("room");
    const wrapped = cycleTimelineDawTrackFolderSendFocus(previous.sends, "folder", "room", -1);
    expect(wrapped.focusedSendId).toBe("cue");
    expect(() => cycleTimelineDawTrackFolderSendFocus(sends, "folder", "other", 1)).toThrow(/belong/);
  });

  it("jumps focused audition to the first or last folder send", () => {
    const sends = [
      { id: "room", sourceKind: "bus" as const, sourceId: "folder", muted: true },
      { id: "delay", sourceKind: "bus" as const, sourceId: "folder", muted: false },
      { id: "cue", sourceKind: "bus" as const, sourceId: "folder", muted: true },
      { id: "other", sourceKind: "bus" as const, sourceId: "other-folder", muted: false },
    ];
    const last = jumpTimelineDawTrackFolderSendFocus(sends, "folder", "last");
    expect(last.focusedSendId).toBe("cue");
    expect(last.sends.map((send) => send.muted)).toEqual([true, true, false, false]);
    const first = jumpTimelineDawTrackFolderSendFocus(last.sends, "folder", "first");
    expect(first.focusedSendId).toBe("room");
    expect(first.sends.map((send) => send.muted)).toEqual([false, true, true, false]);
    expect(() => jumpTimelineDawTrackFolderSendFocus(sends, "missing", "first")).toThrow(/at least one/);
  });

  it("toggles between focused audition and the exact original send mix", () => {
    const sends = [
      { id: "room", sourceKind: "bus" as const, sourceId: "folder", muted: false },
      { id: "delay", sourceKind: "bus" as const, sourceId: "folder", muted: true },
      { id: "cue", sourceKind: "bus" as const, sourceId: "folder", muted: false },
      { id: "other", sourceKind: "bus" as const, sourceId: "other-folder", muted: false },
    ];
    const focused = createTimelineDawTrackFolderSendFocusCheck(sends, "folder", "delay");
    const original = toggleTimelineDawTrackFolderSendFocusReference(focused.sends, "folder", "delay", focused.snapshot, false);
    expect(original.showingOriginal).toBe(true);
    expect(original.sends).toEqual(sends);
    const compared = toggleTimelineDawTrackFolderSendFocusReference(original.sends, "folder", "delay", focused.snapshot, true);
    expect(compared.showingOriginal).toBe(false);
    expect(compared.sends.map((send) => send.muted)).toEqual([true, false, true, false]);
    expect(() => toggleTimelineDawTrackFolderSendFocusReference(sends, "folder", "other", focused.snapshot, false)).toThrow(/belong/);
  });
});
