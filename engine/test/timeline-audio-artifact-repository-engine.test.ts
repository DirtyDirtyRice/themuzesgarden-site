import { describe, expect, it } from "vitest";
import { TimelineAudioArtifactRepositoryEngine } from "../../lib/timeline/TimelineAudioArtifactRepositoryEngine";
import type { TimelineAudioProcessingJob } from "../../lib/timeline/TimelineAudioProcessingQueueEngine";

function register(
  repository: TimelineAudioArtifactRepositoryEngine,
  overrides: Partial<
    Parameters<TimelineAudioArtifactRepositoryEngine["register"]>[0]
  > = {},
) {
  return repository.register({
    fingerprint: "sha256-render-1",
    kind: "audio",
    format: "WAV",
    mediaType: "audio/wav",
    sizeBytes: 1_000,
    durationSeconds: 12,
    replica: {
      uri: "audio://primary/render-1.wav",
      storageProvider: "primary",
    },
    createdBy: "member-1",
    ...overrides,
  });
}

function succeededJob(): TimelineAudioProcessingJob {
  return {
    id: "timeline-audio-job-1",
    revisionId: "timeline-track-revision-7",
    kind: "render",
    state: "succeeded",
    priority: 0,
    dependencyJobIds: [],
    inputs: [
      {
        uri: "audio://source.wav",
        fingerprint: "sha256-source",
        role: "source",
      },
    ],
    output: {
      uri: "audio://render.wav",
      fingerprint: "sha256-job-render",
      role: "render",
    },
    outputSpecification: { format: "wav" },
    maxAttempts: 3,
    attempts: [],
    leaseOwner: null,
    leaseExpiresAt: null,
    createdAt: "2026-07-24T12:00:00.000Z",
    createdBy: "member-1",
    updatedAt: "2026-07-24T12:01:00.000Z",
    updatedBy: "worker-1",
    completedAt: "2026-07-24T12:01:00.000Z",
  };
}

describe("TimelineAudioArtifactRepositoryEngine", () => {
  it("deduplicates content while preserving replicas, references, and saved bytes", () => {
    const repository = new TimelineAudioArtifactRepositoryEngine();
    const first = register(repository);
    const second = register(repository, {
      sizeBytes: 1_000.9,
      replica: {
        uri: "audio://backup/render-1.wav",
        storageProvider: "backup",
      },
    });
    const artifactId = first.artifact!.id;
    repository.linkReference({
      artifactId,
      kind: "revision",
      ownerId: "revision-1",
      role: "render",
      linkedBy: "member-1",
    });
    repository.linkReference({
      artifactId,
      kind: "revision",
      ownerId: "revision-2",
      role: "render",
      linkedBy: "member-1",
    });
    repository.linkReference({
      artifactId,
      kind: "release",
      ownerId: "release-1",
      role: "master",
      linkedBy: "member-1",
    });

    expect(second).toMatchObject({ accepted: true, deduplicated: true });
    expect(second.artifact?.replicas).toHaveLength(2);
    expect(repository.statistics()).toMatchObject({
      artifacts: 1,
      replicas: 2,
      references: 3,
      logicalBytes: 3_000,
      physicalBytes: 2_000,
      deduplicatedBytes: 1_000,
    });
  });

  it("rejects conflicting metadata for identical content", () => {
    const repository = new TimelineAudioArtifactRepositoryEngine();
    register(repository);

    const conflict = register(repository, {
      mediaType: "audio/flac",
      replica: {
        uri: "audio://other/render-1.flac",
        storageProvider: "other",
      },
    });

    expect(conflict.accepted).toBe(false);
    expect(conflict.issues[0].code).toBe("metadata-conflict");
    expect(repository.statistics().artifacts).toBe(1);
  });

  it("registers succeeded processing outputs and links their job and revision", () => {
    const repository = new TimelineAudioArtifactRepositoryEngine();

    const result = repository.registerCompletedJob({
      job: succeededJob(),
      kind: "audio",
      format: "wav",
      mediaType: "audio/wav",
      sizeBytes: 4_096,
      storageProvider: "render-store",
      registeredBy: "worker-1",
    });

    expect(result.accepted).toBe(true);
    expect(result.artifact?.references).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "processing-job",
          ownerId: "timeline-audio-job-1",
        }),
        expect.objectContaining({
          kind: "revision",
          ownerId: "timeline-track-revision-7",
        }),
      ]),
    );
    expect(repository.findByFingerprint("sha256-job-render")?.id).toBe(
      result.artifact?.id,
    );
  });

  it("keeps healthy replicas available and quarantines content when all copies fail", () => {
    const repository = new TimelineAudioArtifactRepositoryEngine();
    const first = register(repository);
    const second = register(repository, {
      replica: {
        uri: "audio://backup/render-1.wav",
        storageProvider: "backup",
      },
    });
    const [primary, backup] = second.artifact!.replicas;

    const corrupt = repository.verifyReplica({
      artifactId: first.artifact!.id,
      replicaId: primary.id,
      exists: true,
      observedFingerprint: "sha256-tampered",
      observedSizeBytes: 1_000,
      verifiedBy: "integrity-worker",
    });
    const missing = repository.verifyReplica({
      artifactId: first.artifact!.id,
      replicaId: backup.id,
      exists: false,
      verifiedBy: "integrity-worker",
    });

    expect(corrupt.accepted).toBe(false);
    expect(corrupt.artifact?.state).toBe("available");
    expect(missing.accepted).toBe(false);
    expect(missing.issues[0].code).toBe("replica-missing");
    expect(missing.artifact?.state).toBe("quarantined");
  });

  it("protects referenced artifacts, retains trash, purges it, and resumes IDs after restart", () => {
    let current = new Date("2026-07-24T12:00:00.000Z");
    const repository = new TimelineAudioArtifactRepositoryEngine(() => current);
    const artifact = register(repository).artifact!;
    const linked = repository.linkReference({
      artifactId: artifact.id,
      kind: "revision",
      ownerId: "revision-1",
      role: "render",
      linkedBy: "member-1",
    }).artifact!;

    expect(
      repository.moveToTrash({
        artifactId: artifact.id,
        movedBy: "member-1",
      }).issues[0].code,
    ).toBe("artifact-referenced");

    repository.unlinkReference({
      artifactId: artifact.id,
      referenceId: linked.references[0].id,
      unlinkedBy: "member-1",
      retentionDays: 7,
    });
    expect(repository.getArtifact(artifact.id)?.state).toBe("trash");
    current = new Date("2026-07-31T11:59:59.000Z");
    expect(repository.purgeExpired()).toEqual([]);

    const archive = repository.exportArchive();
    const restarted = new TimelineAudioArtifactRepositoryEngine(() => current);
    restarted.restoreArchive(archive);
    const next = register(restarted, {
      fingerprint: "sha256-render-2",
      replica: {
        uri: "audio://primary/render-2.wav",
        storageProvider: "primary",
      },
    }).artifact!;
    expect(next.id).toBe("timeline-audio-artifact-2");
    expect(next.replicas[0].id).toBe("timeline-audio-replica-2");

    current = new Date("2026-07-31T12:00:01.000Z");
    expect(restarted.purgeExpired()).toEqual([artifact.id]);
    expect(restarted.getArtifact(artifact.id)).toBeNull();

    expect(() =>
      restarted.restoreArchive({
        artifacts: [next, { ...next, fingerprint: "sha256-other" }],
      }),
    ).toThrow("Duplicate artifact ID");
  });
});
