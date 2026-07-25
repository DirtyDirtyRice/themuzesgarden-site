import { describe, expect, it } from "vitest";

import {
  TimelineReferenceTrackAnalysisEngine,
  type TimelineReferenceFeatureProfile,
} from "../../lib/timeline/TimelineReferenceTrackAnalysisEngine";

function profile(
  overrides: Partial<TimelineReferenceFeatureProfile> = {},
): TimelineReferenceFeatureProfile {
  return {
    durationSeconds: 240,
    tempoBpm: 120,
    keyClass: 9,
    mode: "minor",
    integratedLufs: -14,
    truePeakDbtp: -1,
    loudnessRangeLu: 8,
    stereoWidth: 0.65,
    spectralBalance: {
      low: 0.2,
      lowMid: 0.3,
      highMid: 0.3,
      high: 0.2,
    },
    sections: [
      { label: "Verse", startSeconds: 0, endSeconds: 120, energy: 0.5 },
      { label: "Chorus", startSeconds: 120, endSeconds: 240, energy: 0.8 },
    ],
    ...overrides,
  };
}

function approvedReference(
  engine: TimelineReferenceTrackAnalysisEngine,
  features = profile(),
) {
  const reference = engine.registerReference({
    projectId: "song-1",
    title: "Licensed reference",
    creatorName: "Reference creator",
    sourceFingerprint: `sha256-reference-${features.tempoBpm}`,
    rightsBasis: "licensed",
    rightsReference: "license-123",
    purpose: "Compare objective loudness, dynamics, and spectrum.",
    features,
    createdBy: "producer-1",
  });
  return engine.reviewReference({
    referenceId: reference.id,
    accepted: true,
    note: "License and analysis purpose verified.",
    reviewedBy: "rights-reviewer-1",
  });
}

describe("TimelineReferenceTrackAnalysisEngine", () => {
  it("rejects invalid feature profiles before analysis", () => {
    const engine = new TimelineReferenceTrackAnalysisEngine();
    expect(() =>
      engine.recordTargetAnalysis({
        projectId: "song-1",
        artifactId: "mix-1",
        artifactFingerprint: "sha256-mix-1",
        label: "Mix",
        features: profile({
          spectralBalance: {
            low: 0.5,
            lowMid: 0.5,
            highMid: 0.5,
            high: 0.5,
          },
        }),
        analyzedBy: "analyzer-1",
      }),
    ).toThrow("total 1");
  });

  it("holds references for human rights review and blocks imitation goals", () => {
    const engine = new TimelineReferenceTrackAnalysisEngine();
    expect(() =>
      engine.registerReference({
        projectId: "song-1",
        title: "Famous song",
        creatorName: "Named Artist",
        namedArtistReference: true,
        sourceFingerprint: "sha256-famous",
        rightsBasis: "licensed",
        rightsReference: "license-1",
        purpose: "Clone and sound exactly like this named artist.",
        features: profile(),
        createdBy: "producer-1",
      }),
    ).toThrow("not imitation");
    const held = engine.registerReference({
      projectId: "song-1",
      title: "Permitted reference",
      creatorName: "Creator",
      sourceFingerprint: "sha256-permitted",
      rightsBasis: "permission",
      rightsReference: "permission-email-1",
      purpose: "Compare measurable mix balance.",
      features: profile(),
      createdBy: "producer-1",
    });
    const target = engine.recordTargetAnalysis({
      projectId: "song-1",
      artifactId: "mix-1",
      artifactFingerprint: "sha256-mix-1",
      label: "Mix",
      features: profile(),
      analyzedBy: "analyzer-1",
    });
    expect(() =>
      engine.compare({
        targetId: target.id,
        referenceIds: [held.id],
        createdBy: "producer-1",
      }),
    ).toThrow("approved");
  });

  it("aggregates approved references and reports deterministic metric gaps", () => {
    const engine = new TimelineReferenceTrackAnalysisEngine();
    const first = approvedReference(engine, profile({ tempoBpm: 100 }));
    const second = approvedReference(engine, profile({ tempoBpm: 140 }));
    const target = engine.recordTargetAnalysis({
      projectId: "song-1",
      artifactId: "mix-1",
      artifactFingerprint: "sha256-mix-1",
      label: "Current mix",
      features: profile({ tempoBpm: 130, integratedLufs: -20 }),
      analyzedBy: "analyzer-1",
    });
    const comparison = engine.compare({
      targetId: target.id,
      referenceIds: [first.id, second.id],
      createdBy: "producer-1",
    });
    expect(comparison.aggregate.tempoBpm).toBe(120);
    expect(comparison.gaps.find((gap) => gap.metric === "tempo")?.difference).toBe(
      10,
    );
    expect(
      comparison.gaps.find((gap) => gap.metric === "loudness")?.difference,
    ).toBe(-6);
  });

  it("creates reviewable recommendations without copying source audio", () => {
    const engine = new TimelineReferenceTrackAnalysisEngine();
    const reference = approvedReference(engine);
    const target = engine.recordTargetAnalysis({
      projectId: "song-1",
      artifactId: "mix-1",
      artifactFingerprint: "sha256-mix-1",
      label: "Current mix",
      features: profile({
        integratedLufs: -25,
        stereoWidth: 0.1,
      }),
      analyzedBy: "analyzer-1",
    });
    const comparison = engine.compare({
      targetId: target.id,
      referenceIds: [reference.id],
      createdBy: "producer-1",
    });
    expect(comparison.recommendations[0].priority).toBe("high");
    expect(comparison.policyNotice).toContain("does not copy audio");
    expect(
      engine.reviewComparison({
        comparisonId: comparison.id,
        note: "Use loudness guidance; preserve intentional narrow intro.",
        reviewedBy: "producer-1",
      }).status,
    ).toBe("reviewed");
  });

  it("restores analysis evidence and continues stable identities", () => {
    const engine = new TimelineReferenceTrackAnalysisEngine();
    const first = approvedReference(engine);
    const restored = new TimelineReferenceTrackAnalysisEngine();
    restored.restoreArchive(engine.exportArchive());
    expect(restored.getReference(first.id)?.status).toBe("approved");
    expect(restored.listReceipts("song-1")[0].id).toBe(
      "timeline-reference-receipt-1",
    );
    const second = restored.registerReference({
      projectId: "song-1",
      title: "Second reference",
      creatorName: "Creator 2",
      sourceFingerprint: "sha256-second",
      rightsBasis: "owned",
      rightsReference: "ownership-2",
      purpose: "Compare objective dynamics.",
      features: profile(),
      createdBy: "producer-1",
    });
    expect(second.id).toBe("timeline-reference-track-2");
  });
});
