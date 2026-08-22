import { describe, expect, it } from "vitest";
import { parseTimelineDawTrackFolderRouting, parseTimelineDawTrackFolderSend } from "../../lib/timeline/TimelineDawTrackFolderRoutingPolicy";

describe("DAW track folder routing policy", () => {
  it("deduplicates a bounded folder assignment", () => {
    expect(parseTimelineDawTrackFolderRouting({ laneIds: [" a ", "b", "a"], busId: " bus-1 " })).toEqual({ laneIds: ["a", "b"], busId: "bus-1" });
    expect(() => parseTimelineDawTrackFolderRouting({ laneIds: ["a"], busId: null })).toThrow(/between 2 and 500/);
  });

  it("creates a post-fader bus send and rejects a feedback self-route", () => {
    expect(parseTimelineDawTrackFolderSend("bus-1", "bus-2")).toEqual({ sourceKind: "bus", sourceId: "bus-1", destinationBusId: "bus-2", level: 0.5, preFader: false, muted: false });
    expect(() => parseTimelineDawTrackFolderSend("bus-1", "bus-1")).toThrow(/different buses/);
  });
});
