import { describe, expect, it } from "vitest";

import { TimelineVocalProductionEngine } from "../../lib/timeline/TimelineVocalProductionEngine";

function create(engine = new TimelineVocalProductionEngine()) {
  const production = engine.createProduction({
    projectId: "song-1",
    name: "Lead vocal",
    takes: [
      {
        name: "Lead take one",
        audioAssetId: "audio-1",
        singerId: "singer-1",
        startSample: 0,
        sampleLength: 192_000,
        sampleRate: 48_000,
        channels: 1,
      },
      {
        name: "Lead take two",
        audioAssetId: "audio-2",
        singerId: "singer-1",
        startSample: 0,
        sampleLength: 192_000,
        sampleRate: 48_000,
        channels: 1,
      },
    ],
    comp: [
      {
        takeIndex: 0,
        takeId: "",
        sourceStartSample: 0,
        sourceEndSample: 96_000,
        destinationStartSample: 0,
        fadeInSamples: 240,
        fadeOutSamples: 240,
        gainDb: 0,
      },
      {
        takeIndex: 1,
        takeId: "",
        sourceStartSample: 96_000,
        sourceEndSample: 192_000,
        destinationStartSample: 96_000,
        fadeInSamples: 240,
        fadeOutSamples: 240,
        gainDb: -1,
      },
    ],
    processors: [
      {
        kind: "de-esser",
        name: "Lead de-esser",
        enabled: true,
        wet: 1,
        parameters: { frequencyHz: 6_500, reductionDb: 4 },
      },
    ],
    createdBy: "engineer-1",
  });
  return { engine, production };
}

describe("TimelineVocalProductionEngine", () => {
  it("holds incomplete or invalid vocal comps before activation", () => {
    const engine = new TimelineVocalProductionEngine();
    expect(() =>
      engine.createProduction({
        projectId: "song-1",
        name: "Broken vocal",
        takes: [],
        comp: [],
        createdBy: "engineer-1",
      }),
    ).toThrow("at least one take");
  });

  it("creates non-destructive comp and processing revisions", () => {
    const { engine, production } = create();
    const revised = engine.revise({
      productionId: production.id,
      changes: {
        processors: [
          {
            kind: "compressor",
            name: "Lead compressor",
            enabled: true,
            wet: 0.8,
            parameters: { ratio: 3, thresholdDb: -18 },
          },
        ],
      },
      createdBy: "engineer-1",
    });
    expect(revised.id).not.toBe(production.id);
    expect(revised.parentProductionId).toBe(production.id);
    expect(revised.takes).toEqual(production.takes);
    expect(engine.getProduction(production.id)?.processors[0].kind).toBe("de-esser");
  });

  it("requires independent approval after validation", () => {
    const { engine, production } = create();
    expect(
      engine.submitForApproval({
        productionId: production.id,
        submittedBy: "engineer-1",
      }).status,
    ).toBe("held");
    expect(() =>
      engine.approve({
        productionId: production.id,
        approvedBy: "engineer-1",
      }),
    ).toThrow("independent");
    expect(
      engine.approve({
        productionId: production.id,
        approvedBy: "producer-1",
      }).status,
    ).toBe("approved");
  });

  it("keeps one active vocal production per project", () => {
    const { engine, production } = create();
    engine.submitForApproval({ productionId: production.id, submittedBy: "engineer-1" });
    engine.approve({ productionId: production.id, approvedBy: "producer-1" });
    engine.activate({ productionId: production.id, activatedBy: "producer-1" });
    const revised = engine.revise({
      productionId: production.id,
      changes: { name: "Lead vocal final" },
      createdBy: "engineer-1",
    });
    engine.submitForApproval({ productionId: revised.id, submittedBy: "engineer-1" });
    engine.approve({ productionId: revised.id, approvedBy: "producer-1" });
    engine.activate({ productionId: revised.id, activatedBy: "producer-1" });
    expect(engine.activeProduction("song-1")?.id).toBe(revised.id);
    expect(engine.getProduction(production.id)?.status).toBe("archived");
  });

  it("restores fingerprinted history and continues stable identities", () => {
    const { engine, production } = create();
    const restored = new TimelineVocalProductionEngine();
    restored.restoreArchive(engine.exportArchive());
    expect(restored.getProduction(production.id)?.fingerprint).toBe(production.fingerprint);
    expect(restored.listReceipts("song-1")[0].id).toBe("timeline-vocal-receipt-1");
    const next = create(restored).production;
    expect(next.id).toBe("timeline-vocal-production-2");
    expect(next.takes[0].id).toBe("timeline-vocal-take-3");
  });
});
