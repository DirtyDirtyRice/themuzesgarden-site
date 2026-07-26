import { describe, expect, it } from "vitest";
import { TimelineTransportAndSynchronizationEngine } from "../../lib/timeline/TimelineTransportAndSynchronizationEngine";

function create(engine: TimelineTransportAndSynchronizationEngine, options: {
  countInBars?: number;
  synchronizationKind?: "internal" | "midi-clock" | "link" | "ltc" | "mtc";
} = {}) {
  return engine.createTransport({
    projectId: "project-1",
    sessionId: "session-1",
    audioGraphId: "graph-1",
    name: "Main transport",
    sampleRate: 48_000,
    ppq: 960,
    bpm: 120,
    countInBars: options.countInBars,
    synchronizationKind: options.synchronizationKind,
    createdBy: "steve",
  });
}

function activate(engine: TimelineTransportAndSynchronizationEngine, transport = create(engine)) {
  const validated = engine.validate({
    transportId: transport.id,
    expectedHead: transport.head,
    validatedBy: "reviewer",
  });
  return engine.activate({
    transportId: validated.id,
    expectedHead: validated.head,
    activatedBy: "reviewer",
  });
}

describe("TimelineTransportAndSynchronizationEngine", () => {
  it("maps musical ticks to exact samples across tempo changes", () => {
    const engine = new TimelineTransportAndSynchronizationEngine();
    let current = create(engine);
    current = engine.addTempoPoint({
      transportId: current.id,
      expectedHead: current.head,
      tick: 1_920,
      bpm: 60,
      editedBy: "steve",
    });
    expect(engine.tickToSample(current.id, 1_920)).toBe(48_000);
    expect(engine.tickToSample(current.id, 2_880)).toBe(96_000);
    expect(engine.sampleToTick(current.id, 96_000)).toBe(2_880);
  });

  it("plays, pauses, locates, stops, and wraps a sample-accurate loop", () => {
    const engine = new TimelineTransportAndSynchronizationEngine();
    let current = create(engine);
    current = engine.setLoop({
      transportId: current.id,
      expectedHead: current.head,
      enabled: true,
      startTick: 960,
      endTick: 2_880,
      editedBy: "steve",
    });
    current = activate(engine, current);
    current = engine.locate({
      transportId: current.id,
      expectedHead: current.head,
      tick: 2_400,
      locatedBy: "steve",
    });
    current = engine.play({
      transportId: current.id,
      expectedHead: current.head,
      playedBy: "steve",
    });
    current = engine.advance({
      transportId: current.id,
      expectedHead: current.head,
      samples: 24_000,
      advancedBy: "clock",
    });
    expect(current.tick).toBe(1_440);
    expect(current.sample).toBe(36_000);
    current = engine.pause({
      transportId: current.id,
      expectedHead: current.head,
      pausedBy: "steve",
    });
    expect(current.playbackState).toBe("paused");
    current = engine.stop({
      transportId: current.id,
      expectedHead: current.head,
      returnToTick: 960,
      stoppedBy: "steve",
    });
    expect(current).toMatchObject({ playbackState: "stopped", tick: 960, sample: 24_000 });
  });

  it("holds unavailable external clocks and corrects drift beyond tolerance", () => {
    const engine = new TimelineTransportAndSynchronizationEngine();
    let held = create(engine, { synchronizationKind: "midi-clock" });
    held = engine.configureSynchronization({
      transportId: held.id,
      expectedHead: held.head,
      kind: "midi-clock",
      available: false,
      editedBy: "steve",
    });
    held = engine.validate({
      transportId: held.id,
      expectedHead: held.head,
      validatedBy: "reviewer",
    });
    expect(held.status).toBe("held");
    expect(held.issues[0]?.code).toBe("sync-unavailable");

    const second = new TimelineTransportAndSynchronizationEngine();
    let current = create(second, { synchronizationKind: "link" });
    current = second.configureSynchronization({
      transportId: current.id,
      expectedHead: current.head,
      kind: "link",
      available: true,
      toleranceSamples: 100,
      editedBy: "steve",
    });
    current = activate(second, current);
    current = second.observeExternalClock({
      transportId: current.id,
      expectedHead: current.head,
      observedSample: 24_000,
      synchronizedBy: "link-clock",
    });
    expect(current.synchronization.driftSamples).toBe(24_000);
    expect(current).toMatchObject({ sample: 24_000, tick: 960 });
  });

  it("executes a count-in before moving the song playhead and rejects stale edits", () => {
    const engine = new TimelineTransportAndSynchronizationEngine();
    let current = activate(engine, create(engine, { countInBars: 1 }));
    current = engine.play({
      transportId: current.id,
      expectedHead: current.head,
      playedBy: "steve",
    });
    expect(current.playbackState).toBe("counting-in");
    expect(current.countInRemainingTicks).toBe(3_840);
    expect(() => engine.pause({
      transportId: current.id,
      expectedHead: current.head - 1,
      pausedBy: "steve",
    })).toThrow(/head conflict/i);
    current = engine.advance({
      transportId: current.id,
      expectedHead: current.head,
      samples: 96_000,
      advancedBy: "clock",
    });
    expect(current).toMatchObject({
      playbackState: "playing",
      countInRemainingTicks: 0,
      tick: 0,
      sample: 0,
    });
  });

  it("restores transport history and continues every stable identity sequence", () => {
    const source = new TimelineTransportAndSynchronizationEngine();
    let current = create(source);
    current = source.addTimeSignaturePoint({
      transportId: current.id,
      expectedHead: current.head,
      tick: 3_840,
      numerator: 3,
      denominator: 4,
      editedBy: "steve",
    });
    const archive = source.exportArchive();
    const restored = new TimelineTransportAndSynchronizationEngine();
    restored.restoreArchive(archive);
    expect(restored.getTransport(current.id)).toEqual(current);
    expect(restored.listEvents()).toEqual(source.listEvents());
    const next = create(restored);
    expect(next.id).toBe("timeline-transport-sync-2");
    expect(next.tempoMap[0]?.id).toBe("timeline-tempo-point-2");
    expect(next.timeSignatureMap[0]?.id).toBe("timeline-signature-point-3");
    expect(restored.listEvents().at(-1)?.id).toBe("timeline-transport-event-3");
    expect(() => restored.restoreArchive({
      transports: [...archive.transports, ...archive.transports],
      events: archive.events,
    })).toThrow(/duplicate/i);
  });
});
