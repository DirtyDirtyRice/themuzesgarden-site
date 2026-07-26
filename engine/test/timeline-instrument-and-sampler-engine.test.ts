import { describe, expect, it } from "vitest";
import { TimelineInstrumentAndSamplerEngine } from "../../lib/timeline/TimelineInstrumentAndSamplerEngine";

const clock = () => new Date("2026-07-25T12:00:00.000Z");
const create = (engine: TimelineInstrumentAndSamplerEngine, polyphony = 8) =>
  engine.createInstrument({ projectId: "project-1", name: "Garden Sampler", sampleRate: 48_000, polyphony, createdBy: "steve" });
const zone = (engine: TimelineInstrumentAndSamplerEngine, instrumentId: string, expectedHead: number, overrides: Record<string, unknown> = {}) =>
  engine.addZone({
    instrumentId, expectedHead, sourceArtifactId: "sample-1", sourceFingerprint: "sha256:one",
    rootKey: 60, keyLow: 48, keyHigh: 72, startSample: 0, endSample: 48_000, addedBy: "steve", ...overrides,
  });
const active = (engine: TimelineInstrumentAndSamplerEngine, polyphony = 8) => {
  let instrument = create(engine, polyphony);
  instrument = zone(engine, instrument.id, instrument.head);
  instrument = engine.validate({ instrumentId: instrument.id, expectedHead: instrument.head, validatedBy: "steve" });
  return engine.activate({ instrumentId: instrument.id, expectedHead: instrument.head, activatedBy: "steve" });
};

describe("TimelineInstrumentAndSamplerEngine", () => {
  it("validates zones and produces correctly pitched, velocity-scaled voices", () => {
    const engine = new TimelineInstrumentAndSamplerEngine(clock);
    const instrument = active(engine);
    const [voice] = engine.noteOn({ instrumentId: instrument.id, note: 72, velocity: 127, channel: 1, atSample: 0, triggeredBy: "steve" });
    expect(voice.playbackRate).toBeCloseTo(2);
    expect(voice.gainDb).toBeCloseTo(0);
    const released = engine.noteOff({ instrumentId: instrument.id, note: 72, channel: 1, atSample: 24_000, releasedBy: "steve" });
    expect(released[0]).toMatchObject({ state: "release", releasedAtSample: 24_000 });
  });

  it("selects round-robin samples without losing stable zone identity", () => {
    const engine = new TimelineInstrumentAndSamplerEngine(clock);
    let instrument = create(engine);
    instrument = zone(engine, instrument.id, instrument.head, { keyLow: 60, keyHigh: 60, roundRobinGroup: 1, sourceArtifactId: "sample-a" });
    instrument = zone(engine, instrument.id, instrument.head, { keyLow: 60, keyHigh: 60, roundRobinGroup: 1, sourceArtifactId: "sample-b" });
    instrument = engine.validate({ instrumentId: instrument.id, expectedHead: instrument.head, validatedBy: "steve" });
    instrument = engine.activate({ instrumentId: instrument.id, expectedHead: instrument.head, activatedBy: "steve" });
    const first = engine.noteOn({ instrumentId: instrument.id, note: 60, velocity: 100, channel: 1, atSample: 0, triggeredBy: "steve" })[0];
    const second = engine.noteOn({ instrumentId: instrument.id, note: 60, velocity: 100, channel: 1, atSample: 1, triggeredBy: "steve" })[0];
    expect(first.zoneId).not.toBe(second.zoneId);
  });

  it("enforces choke groups and deterministic polyphony voice stealing", () => {
    const engine = new TimelineInstrumentAndSamplerEngine(clock);
    let instrument = create(engine, 1);
    instrument = zone(engine, instrument.id, instrument.head, { chokeGroup: 1 });
    instrument = engine.validate({ instrumentId: instrument.id, expectedHead: instrument.head, validatedBy: "steve" });
    instrument = engine.activate({ instrumentId: instrument.id, expectedHead: instrument.head, activatedBy: "steve" });
    const first = engine.noteOn({ instrumentId: instrument.id, note: 60, velocity: 100, channel: 1, atSample: 0, triggeredBy: "steve" })[0];
    engine.noteOn({ instrumentId: instrument.id, note: 62, velocity: 100, channel: 1, atSample: 10, triggeredBy: "steve" });
    expect(engine.exportArchive().voices.find((voice) => voice.id === first.id)?.state).toBe("choked");
    expect(engine.listEvents(instrument.id).some((event) => event.action === "voice-choked")).toBe(true);
  });

  it("holds incomplete instruments and rejects invalid source loops", () => {
    const engine = new TimelineInstrumentAndSamplerEngine(clock);
    let instrument = create(engine);
    instrument = engine.validate({ instrumentId: instrument.id, expectedHead: instrument.head, validatedBy: "steve" });
    expect(instrument.status).toBe("held");
    expect(instrument.issues[0].code).toBe("zone-required");
    expect(() => zone(engine, instrument.id, instrument.head, { loopStartSample: 40_000, loopEndSample: 60_000 })).toThrow(/loop/);
  });

  it("restores instrument, zone, voice, event, and round-robin histories", () => {
    const source = new TimelineInstrumentAndSamplerEngine(clock);
    const instrument = active(source);
    source.noteOn({ instrumentId: instrument.id, note: 60, velocity: 100, channel: 1, atSample: 0, triggeredBy: "steve" });
    const archive = source.exportArchive();
    const restored = new TimelineInstrumentAndSamplerEngine(clock);
    restored.restoreArchive(archive);
    const next = create(restored);
    expect(next.id).not.toBe(instrument.id);
    expect(restored.listEvents(instrument.id)).toEqual(archive.events);
    expect(() => restored.restoreArchive({ ...archive, instruments: [...archive.instruments, archive.instruments[0]] })).toThrow(/duplicate/i);
  });
});
