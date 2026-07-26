import { describe, expect, it } from "vitest";
import {
  resolveTimelineDawTransportShortcut,
  retryTimelineDawTransportConflict,
  secondsToTimelineTick,
  shouldCheckpointTransport,
  shouldIssueTransportPlay,
  TimelineDawTransportCommandQueue,
  timelineTickToSeconds,
  timelineTickToPosition,
} from "../../lib/timeline/TimelineDawTransportViewModel";

describe("TimelineDawTransportViewModel", () => {
  it("maps browser audio time onto the musical transport grid", () => {
    expect(secondsToTimelineTick(2, 120, 960)).toBe(3_840);
    expect(timelineTickToSeconds(3_840, 120, 960)).toBe(2);
    expect(timelineTickToPosition(3_840, 960)).toEqual({
      bar: 2,
      beat: 1,
      tick: 0,
      label: "2:1:0",
    });
    expect(timelineTickToPosition(5_280, 960).label).toBe("2:2:480");
  });

  it("checkpoints only after playback advances by at least one quarter note", () => {
    expect(shouldCheckpointTransport(959, 0, 960)).toBe(false);
    expect(shouldCheckpointTransport(960, 0, 960)).toBe(true);
    expect(shouldCheckpointTransport(1_920, 2_880, 960)).toBe(true);
    expect(() => shouldCheckpointTransport(-1, 0, 960)).toThrow(/whole numbers/i);
  });

  it("resumes an orphaned playing receipt without duplicating its play command", () => {
    expect(shouldIssueTransportPlay("stopped")).toBe(true);
    expect(shouldIssueTransportPlay("paused")).toBe(true);
    expect(shouldIssueTransportPlay("playing")).toBe(false);
    expect(shouldIssueTransportPlay("counting-in")).toBe(false);
  });

  it("maps safe global keyboard shortcuts without stealing editable controls", () => {
    const base = {
      repeat: false,
      defaultPrevented: false,
      hasModifier: false,
      editableTarget: false,
    };
    expect(resolveTimelineDawTransportShortcut({ ...base, key: " " })).toBe("toggle-playback");
    expect(resolveTimelineDawTransportShortcut({ ...base, key: "Escape" })).toBe("stop");
    expect(resolveTimelineDawTransportShortcut({
      ...base,
      key: " ",
      editableTarget: true,
    })).toBeNull();
    expect(resolveTimelineDawTransportShortcut({
      ...base,
      key: "Escape",
      hasModifier: true,
    })).toBeNull();
    expect(resolveTimelineDawTransportShortcut({ ...base, key: "Enter" })).toBeNull();
  });

  it("serializes transport commands and continues after a rejected command", async () => {
    const queue = new TimelineDawTransportCommandQueue();
    const order: string[] = [];
    const first = queue.enqueue(async () => {
      await Promise.resolve();
      order.push("first");
    });
    const rejected = queue.enqueue(async () => {
      order.push("rejected");
      throw new Error("expected");
    });
    const third = queue.enqueue(async () => {
      order.push("third");
    });

    await first;
    await expect(rejected).rejects.toThrow("expected");
    await third;
    expect(order).toEqual(["first", "rejected", "third"]);
  });

  it("refreshes and retries a revision conflict exactly once", async () => {
    let attempts = 0;
    let refreshes = 0;
    const result = await retryTimelineDawTransportConflict(
      async () => {
        attempts += 1;
        if (attempts === 1) throw new Error("conflict");
        return "saved";
      },
      async () => { refreshes += 1; },
      (cause) => cause instanceof Error && cause.message === "conflict",
    );

    expect(result).toBe("saved");
    expect(attempts).toBe(2);
    expect(refreshes).toBe(1);
  });

  it("does not retry a non-conflict failure", async () => {
    let refreshes = 0;
    await expect(retryTimelineDawTransportConflict(
      async () => { throw new Error("unauthorized"); },
      async () => { refreshes += 1; },
      () => false,
    )).rejects.toThrow("unauthorized");
    expect(refreshes).toBe(0);
  });

  it("rejects invalid transport measurements", () => {
    expect(() => secondsToTimelineTick(-1, 120, 960)).toThrow();
    expect(() => timelineTickToPosition(0, 0)).toThrow();
  });
});
