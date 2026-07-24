import { describe, expect, it } from "vitest";
import { TimelineAudioRecoveryPolicyEngine } from "../../lib/timeline/TimelineAudioRecoveryPolicyEngine";
import { TimelineAudioWorkspaceRecoveryEngine } from "../../lib/timeline/TimelineAudioWorkspaceRecoveryEngine";

describe("TimelineAudioRecoveryPolicyEngine", () => {
  it("creates automatic snapshots only when the configured interval is due", () => {
    let current = new Date("2026-07-24T12:00:00.000Z");
    const recovery = new TimelineAudioWorkspaceRecoveryEngine(
      undefined,
      undefined,
      undefined,
      () => current,
    );
    const policy = new TimelineAudioRecoveryPolicyEngine(
      recovery,
      { snapshotIntervalMinutes: 60 },
      () => current,
    );

    expect(policy.snapshotIfDue({ createdBy: "member-1" })?.id).toBe(
      "timeline-audio-recovery-1",
    );
    current = new Date("2026-07-24T12:59:00.000Z");
    expect(policy.snapshotIfDue({ createdBy: "member-1" })).toBeNull();
    current = new Date("2026-07-24T13:00:00.000Z");
    expect(policy.snapshotIfDue({ createdBy: "member-1" })?.id).toBe(
      "timeline-audio-recovery-2",
    );
  });

  it("keeps newest and pinned recovery points while pruning expired snapshots", () => {
    let current = new Date("2026-06-01T12:00:00.000Z");
    const recovery = new TimelineAudioWorkspaceRecoveryEngine(
      undefined,
      undefined,
      undefined,
      () => current,
    );
    const oldest = recovery.createSnapshot({
      label: "Pinned release",
      createdBy: "member-1",
    });
    current = new Date("2026-06-02T12:00:00.000Z");
    recovery.createSnapshot({ label: "Expired", createdBy: "member-1" });
    current = new Date("2026-07-24T12:00:00.000Z");
    const newest = recovery.createSnapshot({
      label: "Newest",
      createdBy: "member-1",
    });
    const policy = new TimelineAudioRecoveryPolicyEngine(
      recovery,
      { retainNewest: 1, maximumSnapshotAgeDays: 30 },
      () => current,
    );
    policy.pinSnapshot(oldest.id);

    const plan = policy.applyRetention();

    expect(plan.keep).toEqual(expect.arrayContaining([oldest.id, newest.id]));
    expect(plan.remove).toEqual(["timeline-audio-recovery-2"]);
    expect(recovery.listSnapshots()).toHaveLength(2);
  });

  it("proves the newest snapshot through an isolated restore drill", () => {
    const recovery = new TimelineAudioWorkspaceRecoveryEngine();
    recovery.createSnapshot({ label: "Recovery", createdBy: "member-1" });
    const policy = new TimelineAudioRecoveryPolicyEngine(recovery);

    const drill = policy.runRestoreDrill();

    expect(drill.status).toBe("passed");
    expect(drill.message).toContain("isolated restore");
    expect(policy.drillHistory()).toHaveLength(1);
  });

  it("restores policy history and continues drill IDs after restart", () => {
    const recovery = new TimelineAudioWorkspaceRecoveryEngine();
    const snapshot = recovery.createSnapshot({
      label: "Recovery",
      createdBy: "member-1",
    });
    const policy = new TimelineAudioRecoveryPolicyEngine(recovery);
    policy.pinSnapshot(snapshot.id);
    policy.runRestoreDrill();
    const archive = policy.exportArchive();
    const restarted = new TimelineAudioRecoveryPolicyEngine(recovery);
    restarted.restoreArchive(archive);

    expect(restarted.runRestoreDrill().id).toBe(
      "timeline-audio-recovery-drill-2",
    );
    expect(restarted.exportArchive().pinnedSnapshotIds).toEqual([snapshot.id]);
  });
});
