import { describe, expect, it } from "vitest";
import { copyTimelineDawTrackFolderSend, parseTimelineDawTrackFolderRouting, parseTimelineDawTrackFolderSend, resolveTimelineDawTrackFolderSendDestinations, resolveTimelineDawTrackFolderSendRemoval, timelineDawTrackFolderSendDbToLevel, timelineDawTrackFolderSendLevelToDb, updateTimelineDawTrackFolderSend } from "../../lib/timeline/TimelineDawTrackFolderRoutingPolicy";

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
});
