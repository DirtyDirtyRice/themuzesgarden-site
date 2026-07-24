import { describe, expect, it } from "vitest";
import { TimelineAudioArtifactRepositoryEngine } from "../../lib/timeline/TimelineAudioArtifactRepositoryEngine";
import { TimelineAudioArtifactIntegrityEngine } from "../../lib/timeline/TimelineAudioArtifactIntegrityEngine";

function register(
  repository: TimelineAudioArtifactRepositoryEngine,
  uri = "audio://primary/master.wav",
  storageProvider = "primary",
) {
  return repository.register({
    fingerprint: "sha256-master",
    kind: "audio",
    format: "wav",
    mediaType: "audio/wav",
    sizeBytes: 8_192,
    durationSeconds: 180,
    replica: { uri, storageProvider },
    createdBy: "member-1",
  }).artifact!;
}

describe("TimelineAudioArtifactIntegrityEngine", () => {
  it("recognizes a verified multi-provider artifact as healthy", () => {
    const repository = new TimelineAudioArtifactRepositoryEngine();
    register(repository);
    register(repository, "audio://backup/master.wav", "backup");
    const integrity = new TimelineAudioArtifactIntegrityEngine(repository);

    const scan = integrity.scan();

    expect(scan).toMatchObject({
      scannedArtifacts: 1,
      healthy: 1,
      degraded: 0,
      critical: 0,
      openedIssues: 0,
    });
    expect(integrity.activeIssues()).toEqual([]);
  });

  it("records under-replication and overdue verification without duplicating incidents", () => {
    let current = new Date("2026-07-24T12:00:00.000Z");
    const repository = new TimelineAudioArtifactRepositoryEngine(() => current);
    register(repository);
    const integrity = new TimelineAudioArtifactIntegrityEngine(
      repository,
      { verificationIntervalHours: 24 },
      () => current,
    );
    current = new Date("2026-07-26T12:00:00.000Z");

    const first = integrity.scan();
    const second = integrity.scan();

    expect(first.degraded).toBe(1);
    expect(first.findings[0].issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "replica-under-target",
        "provider-under-target",
        "verification-overdue",
      ]),
    );
    expect(first.openedIssues).toBe(3);
    expect(second.openedIssues).toBe(0);
    expect(integrity.activeIssues()).toHaveLength(3);
  });

  it("repairs a corrupt replica from a healthy source and resolves its incidents", () => {
    const repository = new TimelineAudioArtifactRepositoryEngine();
    const artifact = register(repository);
    const replicated = register(
      repository,
      "audio://backup/master.wav",
      "backup",
    );
    const [source, target] = replicated.replicas;
    repository.verifyReplica({
      artifactId: artifact.id,
      replicaId: target.id,
      exists: true,
      observedFingerprint: "sha256-corrupt",
      observedSizeBytes: artifact.sizeBytes,
      verifiedBy: "integrity-worker",
    });
    const integrity = new TimelineAudioArtifactIntegrityEngine(repository);
    const degraded = integrity.scan();

    const repair = integrity.repairReplica({
      artifactId: artifact.id,
      sourceReplicaId: source.id,
      targetReplicaId: target.id,
      repairedBy: "integrity-worker",
    });
    const healed = integrity.scan();

    expect(degraded.degraded).toBe(1);
    expect(repair.targetReplicaId).toBe(target.id);
    expect(healed).toMatchObject({
      healthy: 1,
      resolvedIssues: 3,
    });
    expect(integrity.activeIssues()).toEqual([]);
    expect(integrity.issueHistory().every((issue) => issue.resolvedAt)).toBe(
      true,
    );
  });

  it("marks an artifact critical when every replica is unavailable", () => {
    const repository = new TimelineAudioArtifactRepositoryEngine();
    const artifact = register(repository);
    repository.verifyReplica({
      artifactId: artifact.id,
      replicaId: artifact.replicas[0].id,
      exists: false,
      verifiedBy: "integrity-worker",
    });
    const integrity = new TimelineAudioArtifactIntegrityEngine(repository);

    const finding = integrity.scan().findings[0];

    expect(finding.severity).toBe("critical");
    expect(finding.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["artifact-unavailable", "replica-missing"]),
    );
  });

  it("adds safe replicas and resumes incident, scan, and repair IDs after restart", () => {
    const repository = new TimelineAudioArtifactRepositoryEngine();
    const artifact = register(repository);
    const integrity = new TimelineAudioArtifactIntegrityEngine(repository);
    integrity.scan();
    const replicated = integrity.addReplica({
      artifactId: artifact.id,
      uri: "audio://backup/master.wav",
      storageProvider: "backup",
      addedBy: "member-1",
    });
    const [source, target] = replicated.replicas;
    repository.verifyReplica({
      artifactId: artifact.id,
      replicaId: target.id,
      exists: false,
      verifiedBy: "integrity-worker",
    });
    integrity.scan();
    integrity.repairReplica({
      artifactId: artifact.id,
      sourceReplicaId: source.id,
      targetReplicaId: target.id,
      repairedBy: "integrity-worker",
    });
    const archive = integrity.exportArchive();
    const restarted = new TimelineAudioArtifactIntegrityEngine(repository);
    restarted.restoreArchive(archive);

    const nextScan = restarted.scan();

    expect(nextScan.id).toBe("timeline-artifact-integrity-scan-3");
    expect(nextScan.resolvedIssues).toBeGreaterThan(0);
    expect(restarted.repairHistory()[0].id).toBe(
      "timeline-artifact-integrity-repair-1",
    );
    expect(() =>
      restarted.restoreArchive({
        ...archive,
        issues: [archive.issues[0], archive.issues[0]],
      }),
    ).toThrow("Duplicate integrity issue ID");
  });
});
