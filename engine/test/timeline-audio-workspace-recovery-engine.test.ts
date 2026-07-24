import { describe, expect, it } from "vitest";
import { TimelineAudioArtifactIntegrityEngine } from "../../lib/timeline/TimelineAudioArtifactIntegrityEngine";
import { TimelineAudioArtifactRepositoryEngine } from "../../lib/timeline/TimelineAudioArtifactRepositoryEngine";
import { TimelineAudioProcessingQueueEngine } from "../../lib/timeline/TimelineAudioProcessingQueueEngine";
import { TimelineAudioWorkspaceRecoveryEngine } from "../../lib/timeline/TimelineAudioWorkspaceRecoveryEngine";

function createRecovery() {
  const queue = new TimelineAudioProcessingQueueEngine();
  const artifacts = new TimelineAudioArtifactRepositoryEngine();
  const integrity = new TimelineAudioArtifactIntegrityEngine(artifacts);
  return new TimelineAudioWorkspaceRecoveryEngine(queue, artifacts, integrity);
}

describe("TimelineAudioWorkspaceRecoveryEngine", () => {
  it("captures and restores a consistent multi-engine recovery point", () => {
    const recovery = createRecovery();
    recovery.artifacts.register({
      fingerprint: "sha256-master",
      kind: "audio",
      format: "wav",
      mediaType: "audio/wav",
      sizeBytes: 4_096,
      replica: { uri: "audio://master.wav", storageProvider: "primary" },
      createdBy: "member-1",
    });
    recovery.integrity.scan();

    const snapshot = recovery.createSnapshot({
      label: "Before mix changes",
      createdBy: "member-1",
    });
    const restored = recovery.restoreSnapshot(snapshot);

    expect(recovery.validateSnapshot(snapshot).valid).toBe(true);
    expect(snapshot.manifest).toMatchObject({
      artifacts: 1,
      replicas: 1,
      integrityScans: 1,
    });
    expect(
      restored.artifacts.findByFingerprint("sha256-master"),
    ).not.toBeNull();
    expect(restored.integrity.scanHistory()).toHaveLength(1);
  });

  it("refuses tampered snapshot content before mutating any engine", () => {
    const recovery = createRecovery();
    const snapshot = recovery.createSnapshot({
      label: "Known good",
      createdBy: "member-1",
    });
    const tampered = { ...snapshot, label: "Changed after signing" };

    expect(recovery.validateSnapshot(tampered).issues[0].code).toBe(
      "checksum-mismatch",
    );
    expect(() => recovery.restoreSnapshot(tampered)).toThrow(
      "Recovery snapshot is invalid",
    );
  });

  it("detects broken integrity references even when a checksum is replaced", () => {
    const recovery = createRecovery();
    recovery.integrity.scan();
    const snapshot = recovery.createSnapshot({
      label: "Reference check",
      createdBy: "member-1",
    });
    const forged = structuredClone(snapshot);
    forged.integrity.issues.push({
      id: "timeline-artifact-integrity-issue-99",
      artifactId: "missing-artifact",
      code: "artifact-unavailable",
      severity: "critical",
      message: "Missing",
      openedAt: snapshot.createdAt,
      lastObservedAt: snapshot.createdAt,
    });

    const issues = recovery
      .validateSnapshot(forged)
      .issues.map((issue) => issue.code);
    expect(issues).toContain("checksum-mismatch");
    expect(issues).toContain("artifact-reference-broken");
  });

  it("restores snapshot catalogs and continues stable recovery IDs", () => {
    const recovery = createRecovery();
    const first = recovery.createSnapshot({
      label: "First",
      createdBy: "member-1",
    });
    const restarted = createRecovery();
    restarted.restoreCatalog([first]);
    const second = restarted.createSnapshot({
      label: "Second",
      createdBy: "member-1",
    });

    expect(second.id).toBe("timeline-audio-recovery-2");
    expect(() => restarted.restoreCatalog([first, first])).toThrow(
      "Duplicate recovery snapshot ID",
    );
  });
});
