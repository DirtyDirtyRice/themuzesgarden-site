import { describe, expect, it } from "vitest";

import { TimelineInterchangeExportEngine } from "../../lib/timeline/TimelineInterchangeExportEngine";

function create(engine = new TimelineInterchangeExportEngine()) {
  const value = engine.createPackage({
    projectId: "song-1",
    name: "Mix handoff",
    destination: "Outside Mixer",
    specification: {
      format: "aaf",
      sampleRate: 48_000,
      bitDepth: 24,
      frameRate: 30,
      startTimecode: "01:00:00:00",
      handleLengthMs: 5_000,
      consolidateAudio: true,
      includeMedia: true,
      requiredRoles: ["session", "audio", "manifest"],
    },
    assets: [
      {
        artifactId: "session-1",
        role: "session",
        path: "session/song.aaf",
        format: "aaf",
        mediaType: "application/octet-stream",
        fingerprint: "sha256-session",
        sizeBytes: 5_000,
      },
      {
        artifactId: "audio-1",
        role: "audio",
        path: "audio/lead-vocal.wav",
        format: "wav",
        mediaType: "audio/wav",
        fingerprint: "sha256-audio",
        sizeBytes: 10_000_000,
        durationMs: 180_000,
        sampleRate: 48_000,
        bitDepth: 24,
        channels: 1,
      },
      {
        artifactId: "manifest-1",
        role: "manifest",
        path: "manifest.json",
        format: "json",
        mediaType: "application/json",
        fingerprint: "sha256-manifest",
        sizeBytes: 2_000,
      },
    ],
    createdBy: "engineer-1",
  });
  return { engine, value };
}

function observed(value: ReturnType<typeof create>["value"]) {
  return Object.fromEntries(value.assets.map((asset) => [asset.id, asset.fingerprint]));
}

describe("TimelineInterchangeExportEngine", () => {
  it("rejects unsafe paths before package creation", () => {
    const engine = new TimelineInterchangeExportEngine();
    expect(() =>
      engine.createPackage({
        projectId: "song-1",
        name: "Unsafe",
        destination: "Mixer",
        specification: {
          format: "archive",
          sampleRate: 48_000,
          bitDepth: 24,
          startTimecode: "00:00:00:00",
          handleLengthMs: 0,
          consolidateAudio: false,
          includeMedia: true,
          requiredRoles: ["manifest"],
        },
        assets: [
          {
            artifactId: "manifest-1",
            role: "manifest",
            path: "../manifest.json",
            format: "json",
            mediaType: "application/json",
            fingerprint: "hash",
            sizeBytes: 100,
          },
        ],
        createdBy: "engineer-1",
      }),
    ).toThrow("cannot traverse");
  });

  it("holds missing roles, format mismatches, and incorrect fingerprints", () => {
    const { engine, value } = create();
    const held = engine.verify({
      packageId: value.id,
      observedFingerprints: {
        [value.assets[0].id]: "wrong",
      },
      verifiedBy: "export-worker",
    });
    expect(held.status).toBe("held");
    expect(held.issues.join(" ")).toContain("failed fingerprint");
    expect(held.issues.join(" ")).toContain("was not observed");
  });

  it("creates non-destructive export revisions", () => {
    const { engine, value } = create();
    const revised = engine.revise({
      packageId: value.id,
      destination: "Mastering Engineer",
      createdBy: "engineer-1",
    });
    expect(revised.parentPackageId).toBe(value.id);
    expect(revised.revision).toBe(2);
    expect(engine.getPackage(value.id)?.destination).toBe("Outside Mixer");
  });

  it("verifies every asset and requires independent approval before delivery", () => {
    const { engine, value } = create();
    const verified = engine.verify({
      packageId: value.id,
      observedFingerprints: observed(value),
      verifiedBy: "export-worker",
    });
    expect(verified.status).toBe("verified");
    expect(() =>
      engine.approve({ packageId: value.id, approvedBy: "engineer-1" }),
    ).toThrow("independent");
    engine.approve({ packageId: value.id, approvedBy: "producer-1" });
    expect(
      engine.deliver({
        packageId: value.id,
        deliveryReference: "delivery://handoff-1",
        deliveredBy: "producer-1",
      }).status,
    ).toBe("delivered");
  });

  it("restores content-addressed history and continues stable identities", () => {
    const { engine, value } = create();
    const restored = new TimelineInterchangeExportEngine();
    restored.restoreArchive(engine.exportArchive());
    expect(restored.getPackage(value.id)?.manifestFingerprint).toBe(value.manifestFingerprint);
    expect(restored.listReceipts()[0].id).toBe("timeline-interchange-receipt-1");
    const next = create(restored).value;
    expect(next.id).toBe("timeline-interchange-package-2");
    expect(next.assets[0].id).toBe("timeline-export-asset-4");
  });
});
