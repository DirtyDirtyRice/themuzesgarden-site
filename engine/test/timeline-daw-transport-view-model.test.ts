import { describe, expect, it } from "vitest";
import {
  clampTimelineDawMediaPosition,
  parseTimelineDawMonitorLevel,
  resolveTimelineDawTransportShortcut,
  retryTimelineDawTransportConflict,
  secondsToTimelineTick,
  shouldCheckpointTransport,
  shouldIssueTransportPlay,
  TimelineDawTransportCommandQueue,
  tempoMappedSecondsToTimelineTick,
  timelineTempoAtTick,
  timelineCountInSchedule,
  timelineMetronomeBeatAtOrAfterTick,
  timelineBarNavigationTick,
  timelineTickToSeconds,
  timelineTickToTempoMappedSeconds,
  timelineTickToPosition,
  timelineTickToMappedPosition,
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
    expect(timelineTickToPosition(2_880, 960, 6, 8).label).toBe("2:1:0");
  });

  it("maps time through persisted tempo changes in both directions", () => {
    const tempoMap = [
      { tick: 0, bpm: 120 },
      { tick: 1_920, bpm: 60 },
    ];
    expect(timelineTickToTempoMappedSeconds(2_880, 960, tempoMap)).toBe(2);
    expect(tempoMappedSecondsToTimelineTick(2, 960, tempoMap)).toBe(2_880);
    expect(timelineTempoAtTick(1_919, tempoMap)).toBe(120);
    expect(timelineTempoAtTick(1_920, tempoMap)).toBe(60);
  });

  it("keeps bar numbering continuous across persisted signature changes", () => {
    const signatures = [
      { tick: 0, numerator: 4, denominator: 4 },
      { tick: 3_840, numerator: 3, denominator: 4 },
    ];
    expect(timelineTickToMappedPosition(3_840, 960, signatures)).toMatchObject({
      label: "2:1:0",
      numerator: 3,
      denominator: 4,
    });
    expect(timelineTickToMappedPosition(6_720, 960, signatures).label).toBe("3:1:0");
  });

  it("builds a meter-aware count-in schedule", () => {
    expect(timelineCountInSchedule({ bars: 1, bpm: 120, numerator: 3 })).toEqual({
      beatOffsetsMs: [0, 500, 1_000],
      durationMs: 1_500,
    });
    expect(timelineCountInSchedule({ bars: 0, bpm: 120, numerator: 4 })).toEqual({
      beatOffsetsMs: [],
      durationMs: 0,
    });
  });

  it("finds metronome beats and downbeat accents across signature changes", () => {
    const signatures = [
      { tick: 0, numerator: 4, denominator: 4 },
      { tick: 3_840, numerator: 3, denominator: 4 },
    ];
    expect(timelineMetronomeBeatAtOrAfterTick(1, 960, signatures)).toEqual({
      tick: 960,
      accent: false,
    });
    expect(timelineMetronomeBeatAtOrAfterTick(3_840, 960, signatures)).toEqual({
      tick: 3_840,
      accent: true,
    });
    expect(timelineMetronomeBeatAtOrAfterTick(4_801, 960, signatures)).toEqual({
      tick: 5_760,
      accent: false,
    });
  });

  it("navigates musical bar boundaries across signature changes", () => {
    const signatures = [
      { tick: 0, numerator: 4, denominator: 4 },
      { tick: 3_840, numerator: 3, denominator: 4 },
    ];
    expect(timelineBarNavigationTick(2_000, "previous", 960, signatures)).toBe(0);
    expect(timelineBarNavigationTick(2_000, "next", 960, signatures)).toBe(3_840);
    expect(timelineBarNavigationTick(3_840, "previous", 960, signatures)).toBe(0);
    expect(timelineBarNavigationTick(3_840, "next", 960, signatures)).toBe(6_720);
    expect(timelineBarNavigationTick(7_000, "previous", 960, signatures)).toBe(6_720);
    expect(timelineBarNavigationTick(0, "previous", 960, signatures)).toBe(0);
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
      key: "ArrowLeft",
      shiftKey: true,
    })).toBe("previous-bar");
    expect(resolveTimelineDawTransportShortcut({
      ...base,
      key: "ArrowRight",
      shiftKey: true,
    })).toBe("next-bar");
    expect(resolveTimelineDawTransportShortcut({ ...base, key: "Home" })).toBe("return-to-start");
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

  it("clamps hardware media seeks to the playable audio duration", () => {
    expect(clampTimelineDawMediaPosition(25, 100)).toBe(25);
    expect(clampTimelineDawMediaPosition(-10, 100)).toBe(0);
    expect(clampTimelineDawMediaPosition(125, 100)).toBe(100);
    expect(clampTimelineDawMediaPosition(10, Number.NaN)).toBeNull();
    expect(clampTimelineDawMediaPosition(10, 0)).toBeNull();
  });

  it("restores and bounds device-local DAW monitor preferences", () => {
    expect(parseTimelineDawMonitorLevel('{"volume":0.42,"muted":true}')).toEqual({
      volume: 0.42,
      muted: true,
    });
    expect(parseTimelineDawMonitorLevel({ volume: 4, muted: false })).toEqual({
      volume: 1,
      muted: false,
    });
    expect(parseTimelineDawMonitorLevel(-2)).toEqual({ volume: 0, muted: false });
    expect(parseTimelineDawMonitorLevel("not-json")).toEqual({ volume: 1, muted: false });
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
