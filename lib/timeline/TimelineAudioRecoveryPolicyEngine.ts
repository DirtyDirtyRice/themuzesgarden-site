import {
  TimelineAudioWorkspaceRecoveryEngine,
  type TimelineAudioRecoveryManifest,
  type TimelineAudioRecoverySnapshot,
} from "./TimelineAudioWorkspaceRecoveryEngine";
import type { TimelineId, TimelineUserId } from "./TimelineTypes";

export type TimelineAudioRecoveryPolicy = {
  snapshotIntervalMinutes: number;
  retainNewest: number;
  maximumSnapshotAgeDays: number;
};

export type TimelineAudioRecoveryDrill = {
  id: TimelineId;
  snapshotId: TimelineId;
  status: "passed" | "failed";
  startedAt: string;
  completedAt: string;
  manifest: TimelineAudioRecoveryManifest;
  message: string;
};

export type TimelineAudioRetentionPlan = {
  keep: TimelineId[];
  remove: TimelineId[];
  pinned: TimelineId[];
};

export type TimelineAudioRecoveryPolicyArchive = {
  policy: TimelineAudioRecoveryPolicy;
  pinnedSnapshotIds: TimelineId[];
  drills: TimelineAudioRecoveryDrill[];
  lastAutomaticSnapshotAt?: string;
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

function normalizedPolicy(
  policy: Partial<TimelineAudioRecoveryPolicy> = {},
): TimelineAudioRecoveryPolicy {
  return {
    snapshotIntervalMinutes: Math.max(
      1,
      Math.trunc(policy.snapshotIntervalMinutes ?? 60),
    ),
    retainNewest: Math.max(1, Math.trunc(policy.retainNewest ?? 24)),
    maximumSnapshotAgeDays: Math.max(
      1,
      Math.trunc(policy.maximumSnapshotAgeDays ?? 30),
    ),
  };
}

export class TimelineAudioRecoveryPolicyEngine {
  private policy: TimelineAudioRecoveryPolicy;
  private readonly pinnedSnapshotIds = new Set<TimelineId>();
  private readonly drills: TimelineAudioRecoveryDrill[] = [];
  private drillSequence = 0;
  private lastAutomaticSnapshotAt?: string;

  constructor(
    readonly recovery = new TimelineAudioWorkspaceRecoveryEngine(),
    policy: Partial<TimelineAudioRecoveryPolicy> = {},
    private readonly now: () => Date = () => new Date(),
  ) {
    this.policy = normalizedPolicy(policy);
  }

  getPolicy(): TimelineAudioRecoveryPolicy {
    return clone(this.policy);
  }

  setPolicy(
    policy: Partial<TimelineAudioRecoveryPolicy>,
  ): TimelineAudioRecoveryPolicy {
    this.policy = normalizedPolicy({ ...this.policy, ...policy });
    return this.getPolicy();
  }

  snapshotIfDue(input: {
    createdBy: TimelineUserId;
    label?: string;
  }): TimelineAudioRecoverySnapshot | null {
    if (this.lastAutomaticSnapshotAt) {
      const elapsed =
        this.now().getTime() - Date.parse(this.lastAutomaticSnapshotAt);
      if (elapsed < this.policy.snapshotIntervalMinutes * 60 * 1_000) {
        return null;
      }
    }
    const snapshot = this.recovery.createSnapshot({
      label: input.label ?? "Automatic audio workspace recovery point",
      createdBy: input.createdBy,
    });
    this.lastAutomaticSnapshotAt = snapshot.createdAt;
    return snapshot;
  }

  pinSnapshot(snapshotId: TimelineId): void {
    if (!this.recovery.getSnapshot(snapshotId)) {
      throw new Error(`Recovery snapshot ${snapshotId} was not found.`);
    }
    this.pinnedSnapshotIds.add(snapshotId);
  }

  unpinSnapshot(snapshotId: TimelineId): boolean {
    return this.pinnedSnapshotIds.delete(snapshotId);
  }

  retentionPlan(): TimelineAudioRetentionPlan {
    const snapshots = this.recovery
      .listSnapshots()
      .sort(
        (left, right) =>
          Date.parse(right.createdAt) - Date.parse(left.createdAt),
      );
    const newest = new Set(
      snapshots
        .slice(0, this.policy.retainNewest)
        .map((snapshot) => snapshot.id),
    );
    const cutoff =
      this.now().getTime() -
      this.policy.maximumSnapshotAgeDays * 24 * 60 * 60 * 1_000;
    const keep: TimelineId[] = [];
    const remove: TimelineId[] = [];
    for (const snapshot of snapshots) {
      if (
        newest.has(snapshot.id) ||
        this.pinnedSnapshotIds.has(snapshot.id) ||
        Date.parse(snapshot.createdAt) >= cutoff
      ) {
        keep.push(snapshot.id);
      } else {
        remove.push(snapshot.id);
      }
    }
    return {
      keep,
      remove,
      pinned: Array.from(this.pinnedSnapshotIds),
    };
  }

  applyRetention(): TimelineAudioRetentionPlan {
    const plan = this.retentionPlan();
    for (const snapshotId of plan.remove) {
      this.recovery.removeSnapshot(snapshotId);
    }
    return plan;
  }

  runRestoreDrill(snapshotId?: TimelineId): TimelineAudioRecoveryDrill {
    const snapshot =
      (snapshotId ? this.recovery.getSnapshot(snapshotId) : null) ??
      this.recovery
        .listSnapshots()
        .sort(
          (left, right) =>
            Date.parse(right.createdAt) - Date.parse(left.createdAt),
        )[0];
    if (!snapshot)
      throw new Error("No recovery snapshot is available for a drill.");
    const startedAt = this.now().toISOString();
    let status: TimelineAudioRecoveryDrill["status"] = "passed";
    let message = "Snapshot validation and isolated restore completed.";
    try {
      this.recovery.restoreSnapshot(snapshot);
    } catch (error) {
      status = "failed";
      message =
        error instanceof Error ? error.message : "Restore drill failed.";
    }
    const drill: TimelineAudioRecoveryDrill = {
      id: `timeline-audio-recovery-drill-${++this.drillSequence}`,
      snapshotId: snapshot.id,
      status,
      startedAt,
      completedAt: this.now().toISOString(),
      manifest: clone(snapshot.manifest),
      message,
    };
    this.drills.push(drill);
    return clone(drill);
  }

  drillHistory(): TimelineAudioRecoveryDrill[] {
    return clone(this.drills);
  }

  exportArchive(): TimelineAudioRecoveryPolicyArchive {
    return {
      policy: this.getPolicy(),
      pinnedSnapshotIds: Array.from(this.pinnedSnapshotIds),
      drills: this.drillHistory(),
      lastAutomaticSnapshotAt: this.lastAutomaticSnapshotAt,
    };
  }

  restoreArchive(archive: TimelineAudioRecoveryPolicyArchive): void {
    this.policy = normalizedPolicy(archive.policy);
    this.pinnedSnapshotIds.clear();
    archive.pinnedSnapshotIds.forEach((id) => this.pinnedSnapshotIds.add(id));
    this.drills.splice(0, this.drills.length, ...clone(archive.drills));
    this.lastAutomaticSnapshotAt = archive.lastAutomaticSnapshotAt;
    this.drillSequence = archive.drills.reduce(
      (maximum, drill) => Math.max(maximum, this.idSequence(drill.id)),
      0,
    );
  }

  private idSequence(id: TimelineId): number {
    return Number(id.match(/(\d+)$/)?.[1] ?? 0);
  }
}

export const timelineAudioRecoveryPolicyEngine =
  new TimelineAudioRecoveryPolicyEngine();
