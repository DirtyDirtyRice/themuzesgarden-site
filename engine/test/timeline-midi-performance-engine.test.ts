import { describe, expect, it } from "vitest";
import { TimelineMidiPerformanceEngine } from "../../lib/timeline/TimelineMidiPerformanceEngine";

const clock = () => new Date("2026-07-25T12:00:00.000Z");
const create = (engine: TimelineMidiPerformanceEngine) =>
  engine.createPerformance({
    projectId: "project-1",
    songId: "song-1",
    multiTrackSessionId: "session-1",
    transportId: "transport-1",
    name: "Keyboard performance",
    createdBy: "steve",
  });

function record(engine: TimelineMidiPerformanceEngine) {
  let performance = create(engine);
  performance = engine.arm({
    performanceId: performance.id,
    expectedHead: performance.head,
    trackId: "track-keys",
    inputDeviceId: "keyboard-1",
    channelFilter: 1,
    armedBy: "steve",
  });
  performance = engine.startRecording({
    performanceId: performance.id,
    expectedHead: performance.head,
    transportPlaying: true,
    startedBy: "steve",
  });
  performance = engine.commitTake({
    performanceId: performance.id,
    expectedHead: performance.head,
    startTick: 0,
    endTick: 1_920,
    notes: [
      { pitch: 60, velocity: 110, releaseVelocity: 64, channel: 1, startTick: 117, durationTicks: 360 },
      { pitch: 64, velocity: 96, releaseVelocity: 60, channel: 1, startTick: 603, durationTicks: 240 },
    ],
    controllers: [
      { controller: 64, value: 127, channel: 1, tick: 100 },
      { controller: 64, value: 0, channel: 1, tick: 900 },
    ],
    recordedBy: "steve",
  });
  return performance;
}

describe("TimelineMidiPerformanceEngine", () => {
  it("captures notes, velocity, channels, and sustain then activates a valid take", () => {
    const engine = new TimelineMidiPerformanceEngine(clock);
    let performance = record(engine);
    expect(performance.takes[0]).toMatchObject({ trackId: "track-keys", selected: true });
    expect(performance.takes[0].controllers.map((event) => event.value)).toEqual([127, 0]);
    performance = engine.validate({ performanceId: performance.id, expectedHead: performance.head, validatedBy: "steve" });
    expect(performance.status).toBe("validated");
    performance = engine.activate({ performanceId: performance.id, expectedHead: performance.head, activatedBy: "steve" });
    expect(performance.status).toBe("active");
  });

  it("derives reversible quantization while preserving the raw human performance", () => {
    const engine = new TimelineMidiPerformanceEngine(clock);
    let performance = record(engine);
    const raw = structuredClone(performance.takes[0]);
    performance = engine.deriveQuantizedTake({
      performanceId: performance.id,
      expectedHead: performance.head,
      takeId: raw.id,
      gridTicks: 120,
      strength: 1,
      createdBy: "steve",
    });
    const derived = performance.takes[1];
    expect(derived.rawTakeId).toBe(raw.id);
    expect(derived.notes.map((note) => note.startTick)).toEqual([120, 600]);
    expect(performance.takes[0]).toEqual(raw);
    performance = engine.selectTake({ performanceId: performance.id, expectedHead: performance.head, takeId: derived.id, selectedBy: "steve" });
    expect(engine.selectedTake(performance.id)?.id).toBe(derived.id);
  });

  it("rejects wrong channels, invalid timing, and stale concurrent writers", () => {
    const engine = new TimelineMidiPerformanceEngine(clock);
    let performance = create(engine);
    performance = engine.arm({ performanceId: performance.id, expectedHead: performance.head, trackId: "track-1", inputDeviceId: "keys", channelFilter: 2, armedBy: "steve" });
    const staleHead = performance.head;
    performance = engine.startRecording({ performanceId: performance.id, expectedHead: performance.head, transportPlaying: true, startedBy: "steve" });
    expect(() => engine.commitTake({
      performanceId: performance.id,
      expectedHead: performance.head,
      startTick: 0,
      endTick: 480,
      notes: [{ pitch: 60, velocity: 100, releaseVelocity: 0, channel: 1, startTick: 0, durationTicks: 120 }],
      recordedBy: "steve",
    })).toThrow(/armed channel/);
    expect(() => engine.arm({ performanceId: performance.id, expectedHead: staleHead, trackId: "track-2", inputDeviceId: "keys", armedBy: "steve" })).toThrow(/head conflict/);
  });

  it("holds incomplete sessions instead of allowing unfinished MIDI into the song", () => {
    const engine = new TimelineMidiPerformanceEngine(clock);
    let performance = create(engine);
    performance = engine.validate({ performanceId: performance.id, expectedHead: performance.head, validatedBy: "steve" });
    expect(performance.status).toBe("held");
    expect(performance.issues.map((issue) => issue.code)).toEqual(["take-required", "selected-take-required"]);
    expect(() => engine.activate({ performanceId: performance.id, expectedHead: performance.head, activatedBy: "steve" })).toThrow(/validated/);
  });

  it("restores stable histories and continues all identity sequences", () => {
    const source = new TimelineMidiPerformanceEngine(clock);
    const performance = record(source);
    const archive = source.exportArchive();
    const restored = new TimelineMidiPerformanceEngine(clock);
    restored.restoreArchive(archive);
    const next = create(restored);
    expect(next.id).not.toBe(performance.id);
    expect(restored.listEvents(performance.id)).toEqual(archive.events);
    expect(() => restored.restoreArchive({ performances: [...archive.performances, archive.performances[0]], events: archive.events })).toThrow(/Duplicate/);
  });
});
