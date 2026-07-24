import type { TimelineId, TimelineUserId } from "./TimelineTypes";

export type TimelineArrangementState = Record<TimelineId, TimelineId>;

export type TimelineArrangementBranch = {
  id: TimelineId;
  songId: TimelineId;
  name: string;
  parentBranchId?: TimelineId;
  baseState: TimelineArrangementState;
  state: TimelineArrangementState;
  head: number;
  createdAt: string;
  createdBy: TimelineUserId;
  updatedAt: string;
  updatedBy: TimelineUserId;
};

export type TimelineArrangementCommit = {
  id: TimelineId;
  branchId: TimelineId;
  head: number;
  message: string;
  changes: TimelineArrangementChange[];
  committedAt: string;
  committedBy: TimelineUserId;
};

export type TimelineArrangementChange =
  | { kind: "set"; trackId: TimelineId; revisionId: TimelineId }
  | { kind: "remove"; trackId: TimelineId };

export type TimelineArrangementConflict = {
  trackId: TimelineId;
  baseRevisionId?: TimelineId;
  sourceRevisionId?: TimelineId;
  targetRevisionId?: TimelineId;
};

export type TimelineArrangementMerge = {
  id: TimelineId;
  sourceBranchId: TimelineId;
  targetBranchId: TimelineId;
  status: "merged" | "conflicted";
  appliedChanges: TimelineArrangementChange[];
  conflicts: TimelineArrangementConflict[];
  createdAt: string;
  createdBy: TimelineUserId;
  resolvedAt?: string;
  resolvedBy?: TimelineUserId;
};

export type TimelineArrangementArchive = {
  branches: TimelineArrangementBranch[];
  commits: TimelineArrangementCommit[];
  merges: TimelineArrangementMerge[];
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

function equal(left?: TimelineId, right?: TimelineId): boolean {
  return left === right;
}

export class TimelineSongArrangementBranchEngine {
  private readonly branches = new Map<TimelineId, TimelineArrangementBranch>();
  private readonly commits: TimelineArrangementCommit[] = [];
  private readonly merges = new Map<TimelineId, TimelineArrangementMerge>();
  private branchSequence = 0;
  private commitSequence = 0;
  private mergeSequence = 0;

  constructor(private readonly now: () => Date = () => new Date()) {}

  createRoot(input: {
    songId: TimelineId;
    name: string;
    state?: TimelineArrangementState;
    createdBy: TimelineUserId;
  }): TimelineArrangementBranch {
    if (!input.songId.trim()) throw new Error("Song ID is required.");
    const now = this.now().toISOString();
    const state = clone(input.state ?? {});
    const branch: TimelineArrangementBranch = {
      id: `timeline-arrangement-branch-${++this.branchSequence}`,
      songId: input.songId,
      name: input.name.trim() || "Main arrangement",
      baseState: clone(state),
      state,
      head: 0,
      createdAt: now,
      createdBy: input.createdBy,
      updatedAt: now,
      updatedBy: input.createdBy,
    };
    this.branches.set(branch.id, clone(branch));
    return clone(branch);
  }

  fork(input: {
    sourceBranchId: TimelineId;
    name: string;
    createdBy: TimelineUserId;
  }): TimelineArrangementBranch {
    const source = this.requiredBranch(input.sourceBranchId);
    const now = this.now().toISOString();
    const branch: TimelineArrangementBranch = {
      id: `timeline-arrangement-branch-${++this.branchSequence}`,
      songId: source.songId,
      name: input.name.trim() || `${source.name} experiment`,
      parentBranchId: source.id,
      baseState: clone(source.state),
      state: clone(source.state),
      head: 0,
      createdAt: now,
      createdBy: input.createdBy,
      updatedAt: now,
      updatedBy: input.createdBy,
    };
    this.branches.set(branch.id, clone(branch));
    return clone(branch);
  }

  commit(input: {
    branchId: TimelineId;
    expectedHead: number;
    message: string;
    changes: TimelineArrangementChange[];
    committedBy: TimelineUserId;
  }): TimelineArrangementCommit {
    const branch = this.requiredBranch(input.branchId);
    if (branch.head !== input.expectedHead) {
      throw new Error(
        `Stale arrangement head ${input.expectedHead}; current head is ${branch.head}.`,
      );
    }
    const changes = this.normalizeChanges(input.changes);
    if (!changes.length) throw new Error("Arrangement commit has no changes.");
    const state = clone(branch.state);
    this.apply(state, changes);
    const now = this.now().toISOString();
    const next = {
      ...branch,
      state,
      head: branch.head + 1,
      updatedAt: now,
      updatedBy: input.committedBy,
    };
    const commit: TimelineArrangementCommit = {
      id: `timeline-arrangement-commit-${++this.commitSequence}`,
      branchId: branch.id,
      head: next.head,
      message: input.message.trim() || "Arrangement update",
      changes,
      committedAt: now,
      committedBy: input.committedBy,
    };
    this.branches.set(next.id, clone(next));
    this.commits.push(clone(commit));
    return clone(commit);
  }

  merge(input: {
    sourceBranchId: TimelineId;
    targetBranchId: TimelineId;
    mergedBy: TimelineUserId;
  }): TimelineArrangementMerge {
    const source = this.requiredBranch(input.sourceBranchId);
    const target = this.requiredBranch(input.targetBranchId);
    if (source.songId !== target.songId) {
      throw new Error("Arrangement branches belong to different songs.");
    }
    const trackIds = new Set([
      ...Object.keys(source.baseState),
      ...Object.keys(source.state),
      ...Object.keys(target.state),
    ]);
    const appliedChanges: TimelineArrangementChange[] = [];
    const conflicts: TimelineArrangementConflict[] = [];
    for (const trackId of trackIds) {
      const base = source.baseState[trackId];
      const sourceValue = source.state[trackId];
      const targetValue = target.state[trackId];
      if (equal(sourceValue, base)) continue;
      if (!equal(targetValue, base) && !equal(targetValue, sourceValue)) {
        conflicts.push({
          trackId,
          baseRevisionId: base,
          sourceRevisionId: sourceValue,
          targetRevisionId: targetValue,
        });
        continue;
      }
      appliedChanges.push(
        sourceValue
          ? { kind: "set", trackId, revisionId: sourceValue }
          : { kind: "remove", trackId },
      );
    }
    if (appliedChanges.length) {
      this.commit({
        branchId: target.id,
        expectedHead: target.head,
        message: `Merge ${source.name}`,
        changes: appliedChanges,
        committedBy: input.mergedBy,
      });
    }
    const merge: TimelineArrangementMerge = {
      id: `timeline-arrangement-merge-${++this.mergeSequence}`,
      sourceBranchId: source.id,
      targetBranchId: target.id,
      status: conflicts.length ? "conflicted" : "merged",
      appliedChanges,
      conflicts,
      createdAt: this.now().toISOString(),
      createdBy: input.mergedBy,
    };
    this.merges.set(merge.id, clone(merge));
    return clone(merge);
  }

  resolveMerge(input: {
    mergeId: TimelineId;
    resolutions: Record<TimelineId, "source" | "target">;
    resolvedBy: TimelineUserId;
  }): TimelineArrangementMerge {
    const merge = this.merges.get(input.mergeId);
    if (!merge)
      throw new Error(`Arrangement merge ${input.mergeId} was not found.`);
    if (merge.status !== "conflicted") return clone(merge);
    const unresolved = merge.conflicts.filter(
      (conflict) => !input.resolutions[conflict.trackId],
    );
    if (unresolved.length) {
      throw new Error("Every arrangement conflict requires a resolution.");
    }
    const target = this.requiredBranch(merge.targetBranchId);
    const changes = merge.conflicts
      .filter((conflict) => input.resolutions[conflict.trackId] === "source")
      .map((conflict): TimelineArrangementChange =>
        conflict.sourceRevisionId
          ? {
              kind: "set",
              trackId: conflict.trackId,
              revisionId: conflict.sourceRevisionId,
            }
          : { kind: "remove", trackId: conflict.trackId },
      );
    if (changes.length) {
      this.commit({
        branchId: target.id,
        expectedHead: target.head,
        message: "Resolve arrangement merge",
        changes,
        committedBy: input.resolvedBy,
      });
    }
    const resolved: TimelineArrangementMerge = {
      ...merge,
      status: "merged",
      resolvedAt: this.now().toISOString(),
      resolvedBy: input.resolvedBy,
    };
    this.merges.set(resolved.id, clone(resolved));
    return clone(resolved);
  }

  getBranch(branchId: TimelineId): TimelineArrangementBranch | null {
    const branch = this.branches.get(branchId);
    return branch ? clone(branch) : null;
  }

  listBranches(songId?: TimelineId): TimelineArrangementBranch[] {
    return Array.from(this.branches.values())
      .filter((branch) => !songId || branch.songId === songId)
      .map(clone);
  }

  commitHistory(branchId?: TimelineId): TimelineArrangementCommit[] {
    return this.commits
      .filter((commit) => !branchId || commit.branchId === branchId)
      .map(clone);
  }

  mergeHistory(): TimelineArrangementMerge[] {
    return Array.from(this.merges.values()).map(clone);
  }

  exportArchive(): TimelineArrangementArchive {
    return {
      branches: this.listBranches(),
      commits: this.commitHistory(),
      merges: this.mergeHistory(),
    };
  }

  restoreArchive(archive: TimelineArrangementArchive): void {
    this.branches.clear();
    this.commits.splice(0);
    this.merges.clear();
    this.branchSequence = 0;
    this.commitSequence = 0;
    this.mergeSequence = 0;
    for (const branch of archive.branches) {
      if (this.branches.has(branch.id)) {
        throw new Error(`Duplicate arrangement branch ID ${branch.id}.`);
      }
      this.branches.set(branch.id, clone(branch));
      this.branchSequence = Math.max(
        this.branchSequence,
        this.idSequence(branch.id),
      );
    }
    const commitIds = new Set<TimelineId>();
    for (const commit of archive.commits) {
      if (commitIds.has(commit.id)) {
        throw new Error(`Duplicate arrangement commit ID ${commit.id}.`);
      }
      commitIds.add(commit.id);
      this.commits.push(clone(commit));
      this.commitSequence = Math.max(
        this.commitSequence,
        this.idSequence(commit.id),
      );
    }
    for (const merge of archive.merges) {
      if (this.merges.has(merge.id)) {
        throw new Error(`Duplicate arrangement merge ID ${merge.id}.`);
      }
      this.merges.set(merge.id, clone(merge));
      this.mergeSequence = Math.max(
        this.mergeSequence,
        this.idSequence(merge.id),
      );
    }
  }

  private normalizeChanges(
    changes: TimelineArrangementChange[],
  ): TimelineArrangementChange[] {
    const byTrack = new Map<TimelineId, TimelineArrangementChange>();
    changes.forEach((change) => {
      if (!change.trackId.trim()) throw new Error("Track ID is required.");
      if (change.kind === "set" && !change.revisionId.trim()) {
        throw new Error("Set changes require a revision ID.");
      }
      byTrack.set(change.trackId, clone(change));
    });
    return Array.from(byTrack.values());
  }

  private apply(
    state: TimelineArrangementState,
    changes: TimelineArrangementChange[],
  ): void {
    changes.forEach((change) => {
      if (change.kind === "set") state[change.trackId] = change.revisionId;
      else delete state[change.trackId];
    });
  }

  private requiredBranch(branchId: TimelineId): TimelineArrangementBranch {
    const branch = this.branches.get(branchId);
    if (!branch)
      throw new Error(`Arrangement branch ${branchId} was not found.`);
    return clone(branch);
  }

  private idSequence(id: TimelineId): number {
    return Number(id.match(/(\d+)$/)?.[1] ?? 0);
  }
}

export const timelineSongArrangementBranchEngine =
  new TimelineSongArrangementBranchEngine();

