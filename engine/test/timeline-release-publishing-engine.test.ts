import { describe, expect, it } from "vitest";

import { TimelineReleasePublishingEngine } from "../../lib/timeline/TimelineReleasePublishingEngine";
import type { TimelineSoundIngredient } from "../../lib/timeline/TimelineSoundRecipeEngine";

function setup() {
  const engine = new TimelineReleasePublishingEngine();
  engine.mastering.restoreArchive({
    jobs: [
      {
        id: "timeline-mastering-job-1",
        comparisonId: "comparison-1",
        candidateId: "candidate-1",
        sessionId: "session-1",
        sourceSnapshotId: "snapshot-1",
        sourceSnapshotChecksum: "sha256-snapshot",
        profile: {
          target: "streaming",
          targetLufs: -14,
          lufsTolerance: 1,
          maximumTruePeakDbtp: -1,
          sampleRateHz: 48_000,
          bitDepth: 24,
          format: "wav",
        },
        steps: [],
        status: "delivered",
        outputUri: "audio://master.wav",
        outputFingerprint: "sha256-master",
        outputMetrics: {
          integratedLufs: -14,
          truePeakDbtp: -1.2,
          loudnessRangeLu: 8,
          stereoCorrelation: 0.8,
          clippedSampleCount: 0,
        },
        issues: [],
        createdAt: "2026-07-24T00:00:00.000Z",
        createdBy: "member-1",
      },
    ],
    receipts: [],
  });
  const ingredient: TimelineSoundIngredient = {
    id: "ingredient-1",
    name: "Original performance",
    kind: "user-recording",
    percentage: 100,
    sourceDescription: "Original studio recording",
    owner: "member-1",
    rightsStatus: "owned",
    contentFingerprint: "sha256-source",
    createdAt: "2026-07-24T00:00:00.000Z",
    createdBy: "member-1",
  };
  const record = engine.rights.registerIngredient({
    projectId: "project-1",
    ingredient,
    registeredBy: "member-1",
  });
  for (const kind of [
    "ownership",
    "source-recording",
    "fingerprint-verification",
  ] as const) {
    engine.rights.addEvidence({
      recordId: record.id,
      kind,
      reference: `${kind}-proof`,
      issuer: "Rights reviewer",
      fingerprint:
        kind === "fingerprint-verification"
          ? ingredient.contentFingerprint
          : undefined,
      addedBy: "reviewer-1",
    });
  }
  engine.rights.review({
    recordId: record.id,
    reviewedBy: "reviewer-1",
  });
  const validInput = {
    projectId: "project-1",
    masteringJobId: "timeline-mastering-job-1",
    rightsRecordIds: [record.id],
    metadata: {
      title: "Garden Song",
      primaryArtist: "The Muzes",
      writers: ["Writer One"],
      releaseDate: "2026-08-21",
      language: "en",
      explicit: false,
      isrc: "USABC2600001",
      upc: "123456789012",
      copyrightLine: "© 2026 The Muzes",
      productionLine: "℗ 2026 The Muzes",
    },
    artwork: {
      uri: "image://cover.png",
      fingerprint: "sha256-cover",
      width: 3000,
      height: 3000,
      mimeType: "image/png" as const,
    },
    destinations: [
      {
        kind: "garden" as const,
        name: "The Muzes Garden",
        territories: ["worldwide"],
      },
      {
        kind: "dsp" as const,
        name: "DSP distributor",
        territories: ["US", "CA"],
      },
    ],
    createdBy: "member-1",
  };
  return { engine, record, validInput };
}

describe("TimelineReleasePublishingEngine", () => {
  it("publishes a cleared package to every destination with permanent evidence", () => {
    const { engine, validInput } = setup();
    const release = engine.createPackage(validInput);
    expect(release.status).toBe("held");
    expect(release.issues).toEqual([]);
    engine.approve({ packageId: release.id, approvedBy: "member-2" });
    let publishing = engine.beginPublishing({
      packageId: release.id,
      requestedBy: "member-2",
    });
    publishing = engine.recordDestination({
      packageId: release.id,
      destinationId: publishing.destinations[0].id,
      outcome: "published",
      externalReleaseId: "garden-123",
      recordedBy: "publisher-1",
    });
    expect(publishing.status).toBe("publishing");
    const finished = engine.recordDestination({
      packageId: release.id,
      destinationId: publishing.destinations[1].id,
      outcome: "published",
      externalReleaseId: "dsp-456",
      recordedBy: "publisher-1",
    });
    expect(finished.status).toBe("published");
    expect(engine.listReceipts(release.id).at(-1)?.action).toBe("published");
  });

  it("holds incomplete metadata, artwork, identifiers, rights, and destinations", () => {
    const { engine, validInput } = setup();
    const release = engine.createPackage({
      ...validInput,
      rightsRecordIds: [],
      metadata: {
        ...validInput.metadata,
        title: "",
        writers: [],
        isrc: "bad",
        upc: "bad",
      },
      artwork: { ...validInput.artwork, fingerprint: "", width: 500, height: 400 },
      destinations: [],
    });
    expect(release.status).toBe("held");
    expect(release.issues.length).toBeGreaterThanOrEqual(8);
    const approval = engine.approve({
      packageId: release.id,
      approvedBy: "member-2",
    });
    expect(approval.status).toBe("held");
  });

  it("rechecks rights at approval and blocks a newly restricted source", () => {
    const { engine, record, validInput } = setup();
    const release = engine.createPackage(validInput);
    engine.rights.addRestriction({
      recordId: record.id,
      usage: "commercial-release",
      description: "Permission withdrawn.",
      prohibitsActivation: true,
      addedBy: "member-1",
    });
    engine.rights.review({
      recordId: record.id,
      reviewedBy: "reviewer-1",
    });
    const approval = engine.approve({
      packageId: release.id,
      approvedBy: "member-2",
    });
    expect(approval.status).toBe("held");
    expect(approval.issues.join(" ")).toContain("not cleared");
  });

  it("records destination failure and requires explicit result evidence", () => {
    const { engine, validInput } = setup();
    const release = engine.createPackage({
      ...validInput,
      destinations: [validInput.destinations[0]],
    });
    engine.approve({ packageId: release.id, approvedBy: "member-2" });
    const publishing = engine.beginPublishing({
      packageId: release.id,
      requestedBy: "member-2",
    });
    expect(() =>
      engine.recordDestination({
        packageId: release.id,
        destinationId: publishing.destinations[0].id,
        outcome: "failed",
        recordedBy: "publisher-1",
      }),
    ).toThrow("error message");
    const failed = engine.recordDestination({
      packageId: release.id,
      destinationId: publishing.destinations[0].id,
      outcome: "failed",
      error: "Distributor rejected the metadata.",
      recordedBy: "publisher-1",
    });
    expect(failed.status).toBe("failed");
  });

  it("restores release history and continues stable identities", () => {
    const { engine, validInput } = setup();
    const release = engine.createPackage(validInput);
    const restored = new TimelineReleasePublishingEngine(
      engine.mastering,
      engine.rights,
    );
    restored.restoreArchive(engine.exportArchive());
    expect(restored.getPackage(release.id)?.masterFingerprint).toBe(
      "sha256-master",
    );
    expect(restored.listReceipts()[0].id).toBe("timeline-release-receipt-1");
  });
});
