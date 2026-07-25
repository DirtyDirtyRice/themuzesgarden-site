import { describe, expect, it } from "vitest";

import { TimelineStemSeparationRecombinationEngine } from "../../lib/timeline/TimelineStemSeparationRecombinationEngine";

function setup() {
  const engine = new TimelineStemSeparationRecombinationEngine();
  const source = engine.registerSource({
    projectId: "song-1",
    artifactId: "mix-artifact-1",
    fingerprint: "sha256-mix-1",
    durationSeconds: 240,
    sampleRateHz: 48_000,
    channels: 2,
    createdBy: "producer-1",
  });
  const separation = engine.createSeparation({
    sourceId: source.id,
    requestedRoles: ["vocals", "drums", "bass"],
    createdBy: "producer-1",
  });
  engine.approveSeparation({
    separationId: separation.id,
    approvedBy: "producer-1",
  });
  engine.startSeparation({
    separationId: separation.id,
    workerId: "stem-worker-1",
  });
  return { engine, source, separation };
}

function stem(
  role: "vocals" | "drums" | "bass",
  fingerprint = `sha256-${role}`,
) {
  return {
    role,
    label: role,
    artifactId: `artifact-${role}`,
    fingerprint,
    sourceFingerprint: "sha256-mix-1",
    durationSeconds: 240,
    sampleRateHz: 48_000,
    channels: 2,
    bleedScore: 0.1,
    confidence: 0.95,
  };
}

function accepted() {
  const value = setup();
  value.engine.submitStems({
    separationId: value.separation.id,
    stems: [stem("vocals"), stem("drums"), stem("bass")],
    workerId: "stem-worker-1",
  });
  value.engine.reviewSeparation({
    separationId: value.separation.id,
    accepted: true,
    note: "Auditioned and accepted.",
    reviewedBy: "producer-1",
  });
  return value;
}

describe("TimelineStemSeparationRecombinationEngine", () => {
  it("holds separation until a human approves processing", () => {
    const engine = new TimelineStemSeparationRecombinationEngine();
    const source = engine.registerSource({
      projectId: "song-1",
      artifactId: "mix-1",
      fingerprint: "sha256-mix-1",
      durationSeconds: 240,
      sampleRateHz: 48_000,
      channels: 2,
      createdBy: "producer-1",
    });
    const separation = engine.createSeparation({
      sourceId: source.id,
      requestedRoles: ["vocals", "drums"],
      createdBy: "producer-1",
    });
    expect(separation.status).toBe("held");
    expect(() =>
      engine.startSeparation({
        separationId: separation.id,
        workerId: "worker-1",
      }),
    ).toThrow("approved");
  });

  it("rejects incomplete, duplicated, or mismatched stem families", () => {
    const { engine, separation } = setup();
    const failed = engine.submitStems({
      separationId: separation.id,
      stems: [
        stem("vocals", "same-fingerprint"),
        {
          ...stem("drums", "same-fingerprint"),
          sourceFingerprint: "sha256-wrong-source",
        },
      ],
      workerId: "stem-worker-1",
    });
    expect(failed.status).toBe("failed");
    expect(failed.issues.join(" ")).toContain("bass");
    expect(failed.issues.join(" ")).toContain("mismatched source");
    expect(failed.issues.join(" ")).toContain("unique fingerprints");
  });

  it("requires one accepted stem family and exactly 100 active percent", () => {
    const { engine, separation } = accepted();
    const stems = engine.listStems(separation.id);
    expect(() =>
      engine.createRecombination({
        separationId: separation.id,
        name: "Bad blend",
        components: stems.map((item) => ({
          stemId: item.id,
          percentage: 30,
          gainDb: 0,
          pan: 0,
          muted: false,
        })),
        createdBy: "producer-1",
      }),
    ).toThrow("exactly 100%");
  });

  it("delivers only a human-approved, duration-verified recombination", () => {
    const { engine, separation } = accepted();
    const stems = engine.listStems(separation.id);
    const mix = engine.createRecombination({
      separationId: separation.id,
      name: "Vocal-up mix",
      components: [
        {
          stemId: stems[0].id,
          percentage: 40,
          gainDb: 1.5,
          pan: 0,
          muted: false,
        },
        {
          stemId: stems[1].id,
          percentage: 30,
          gainDb: 0,
          pan: 0,
          muted: false,
        },
        {
          stemId: stems[2].id,
          percentage: 30,
          gainDb: 0,
          pan: 0,
          muted: false,
        },
      ],
      createdBy: "producer-1",
    });
    engine.approveRecombination({
      recombinationId: mix.id,
      approvedBy: "producer-1",
    });
    expect(
      engine.submitMixdown({
        recombinationId: mix.id,
        outputArtifactId: "mixdown-1",
        outputFingerprint: "sha256-mixdown-1",
        outputDurationSeconds: 240,
        renderedBy: "render-worker-1",
      }).status,
    ).toBe("awaiting-review");
    expect(
      engine.reviewRecombination({
        recombinationId: mix.id,
        accepted: true,
        reviewedBy: "producer-1",
      }).status,
    ).toBe("delivered");
  });

  it("restores lineage evidence and continues stable identities", () => {
    const { engine, separation } = accepted();
    const restored = new TimelineStemSeparationRecombinationEngine();
    restored.restoreArchive(engine.exportArchive());
    expect(restored.getSeparation(separation.id)?.status).toBe("accepted");
    expect(restored.listStems(separation.id)).toHaveLength(3);
    expect(restored.listReceipts("song-1")[0].id).toBe(
      "timeline-stem-receipt-1",
    );
    const nextSource = restored.registerSource({
      projectId: "song-1",
      artifactId: "mix-artifact-2",
      fingerprint: "sha256-mix-2",
      durationSeconds: 200,
      sampleRateHz: 48_000,
      channels: 2,
      createdBy: "producer-1",
    });
    expect(nextSource.id).toBe("timeline-stem-source-2");
  });
});
