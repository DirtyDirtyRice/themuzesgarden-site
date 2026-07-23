import type {
  TimelineEvent,
  TimelineId,
  TimelineUserId,
  TimelineWorkspace,
} from "./TimelineTypes";

export type TimelineVersion = {
  id: TimelineId;
  branchId: TimelineId;
  parentVersionId: TimelineId | null;
  mergeParentVersionId?: TimelineId;
  label: string;
  description: string;
  createdAt: string;
  createdBy: TimelineUserId;
  tags: string[];
  workspace: TimelineWorkspace;
  checksum: string;
};

export type TimelineBranch = {
  id: TimelineId;
  name: string;
  description: string;
  createdAt: string;
  createdBy: TimelineUserId;
  headVersionId: TimelineId | null;
};

export type TimelineVersionChange = {
  eventId: TimelineId;
  kind: "added" | "removed" | "changed";
  fields: string[];
  before: TimelineEvent | null;
  after: TimelineEvent | null;
};

export type TimelineVersionComparison = {
  fromVersionId: TimelineId;
  toVersionId: TimelineId;
  changes: TimelineVersionChange[];
  added: number;
  removed: number;
  changed: number;
  unchanged: number;
};

export type TimelineMergeConflict = {
  eventId: TimelineId;
  field: string;
  base: unknown;
  source: unknown;
  target: unknown;
};

export type TimelineMergePlan = {
  sourceBranchId: TimelineId;
  targetBranchId: TimelineId;
  baseVersionId: TimelineId | null;
  sourceVersionId: TimelineId;
  targetVersionId: TimelineId;
  conflicts: TimelineMergeConflict[];
  mergedWorkspace: TimelineWorkspace;
  canMerge: boolean;
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function stable(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, entry]) => `${JSON.stringify(key)}:${stable(entry)}`)
    .join(",")}}`;
}

function checksum(value: unknown): string {
  const text = stable(value);
  let result = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    result ^= text.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return (result >>> 0).toString(16).padStart(8, "0");
}

function changedFields(before: TimelineEvent, after: TimelineEvent): string[] {
  const keys = new Set([
    ...Object.keys(before),
    ...Object.keys(after),
  ] as (keyof TimelineEvent)[]);
  return Array.from(keys)
    .filter((key) => stable(before[key]) !== stable(after[key]))
    .map(String)
    .sort();
}

export class TimelineVersionEngine {
  private readonly versions = new Map<TimelineId, TimelineVersion>();
  private readonly branches = new Map<TimelineId, TimelineBranch>();
  private versionSequence = 0;

  createBranch(
    id: TimelineId,
    name: string,
    createdBy: TimelineUserId,
    options: {
      description?: string;
      fromVersionId?: TimelineId;
    } = {}
  ): TimelineBranch {
    if (!id.trim() || !name.trim()) throw new Error("Branch requires an ID and name.");
    if (this.branches.has(id)) throw new Error(`Branch ${id} already exists.`);
    if (options.fromVersionId && !this.versions.has(options.fromVersionId)) {
      throw new Error(`Version ${options.fromVersionId} does not exist.`);
    }
    const branch: TimelineBranch = {
      id,
      name: name.trim(),
      description: options.description ?? "",
      createdAt: new Date().toISOString(),
      createdBy,
      headVersionId: options.fromVersionId ?? null,
    };
    this.branches.set(id, branch);
    return clone(branch);
  }

  createVersion(
    branchId: TimelineId,
    workspace: TimelineWorkspace,
    createdBy: TimelineUserId,
    label: string,
    options: {
      description?: string;
      tags?: string[];
      mergeParentVersionId?: TimelineId;
    } = {}
  ): TimelineVersion {
    const branch = this.branches.get(branchId);
    if (!branch) throw new Error(`Branch ${branchId} does not exist.`);
    if (!label.trim()) throw new Error("Version label is required.");
    if (
      branch.headVersionId &&
      checksum(this.versions.get(branch.headVersionId)?.workspace) ===
        checksum(workspace)
    ) {
      throw new Error("Workspace has no changes since the branch head.");
    }
    this.versionSequence += 1;
    const snapshot = clone(workspace);
    const version: TimelineVersion = {
      id: `timeline-version-${this.versionSequence}-${checksum(snapshot)}`,
      branchId,
      parentVersionId: branch.headVersionId,
      mergeParentVersionId: options.mergeParentVersionId,
      label: label.trim(),
      description: options.description ?? "",
      createdAt: new Date().toISOString(),
      createdBy,
      tags: Array.from(new Set(options.tags ?? [])),
      workspace: snapshot,
      checksum: checksum(snapshot),
    };
    this.versions.set(version.id, version);
    branch.headVersionId = version.id;
    return clone(version);
  }

  getVersion(versionId: TimelineId): TimelineVersion | null {
    const version = this.versions.get(versionId);
    return version ? clone(version) : null;
  }

  restore(versionId: TimelineId): TimelineWorkspace {
    const version = this.versions.get(versionId);
    if (!version) throw new Error(`Version ${versionId} does not exist.`);
    if (checksum(version.workspace) !== version.checksum) {
      throw new Error(`Version ${versionId} failed checksum verification.`);
    }
    return clone(version.workspace);
  }

  compare(fromVersionId: TimelineId, toVersionId: TimelineId): TimelineVersionComparison {
    const from = this.versions.get(fromVersionId);
    const to = this.versions.get(toVersionId);
    if (!from || !to) throw new Error("Both versions are required for comparison.");
    const first = new Map(from.workspace.events.map((event) => [event.id, event]));
    const second = new Map(to.workspace.events.map((event) => [event.id, event]));
    const ids = new Set([...first.keys(), ...second.keys()]);
    const changes: TimelineVersionChange[] = [];
    let unchanged = 0;
    ids.forEach((eventId) => {
      const before = first.get(eventId) ?? null;
      const after = second.get(eventId) ?? null;
      if (!before && after) {
        changes.push({ eventId, kind: "added", fields: Object.keys(after), before, after: clone(after) });
      } else if (before && !after) {
        changes.push({ eventId, kind: "removed", fields: Object.keys(before), before: clone(before), after });
      } else if (before && after) {
        const fields = changedFields(before, after);
        if (fields.length) {
          changes.push({ eventId, kind: "changed", fields, before: clone(before), after: clone(after) });
        } else {
          unchanged += 1;
        }
      }
    });
    return {
      fromVersionId,
      toVersionId,
      changes,
      added: changes.filter((change) => change.kind === "added").length,
      removed: changes.filter((change) => change.kind === "removed").length,
      changed: changes.filter((change) => change.kind === "changed").length,
      unchanged,
    };
  }

  getAncestry(versionId: TimelineId): TimelineVersion[] {
    const ancestry: TimelineVersion[] = [];
    const visited = new Set<TimelineId>();
    let current = this.versions.get(versionId);
    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      ancestry.push(clone(current));
      current = current.parentVersionId
        ? this.versions.get(current.parentVersionId)
        : undefined;
    }
    return ancestry;
  }

  private findCommonAncestor(firstId: TimelineId, secondId: TimelineId): TimelineVersion | null {
    const firstAncestors = new Set(this.getAncestry(firstId).map((version) => version.id));
    return this.getAncestry(secondId).find((version) => firstAncestors.has(version.id)) ?? null;
  }

  planMerge(sourceBranchId: TimelineId, targetBranchId: TimelineId): TimelineMergePlan {
    const sourceBranch = this.branches.get(sourceBranchId);
    const targetBranch = this.branches.get(targetBranchId);
    if (!sourceBranch?.headVersionId || !targetBranch?.headVersionId) {
      throw new Error("Both branches require a head version.");
    }
    const source = this.versions.get(sourceBranch.headVersionId)!;
    const target = this.versions.get(targetBranch.headVersionId)!;
    const base = this.findCommonAncestor(source.id, target.id);
    const baseEvents = new Map((base?.workspace.events ?? []).map((event) => [event.id, event]));
    const sourceEvents = new Map(source.workspace.events.map((event) => [event.id, event]));
    const targetEvents = new Map(target.workspace.events.map((event) => [event.id, event]));
    const mergedEvents = new Map(targetEvents);
    const conflicts: TimelineMergeConflict[] = [];
    new Set([...baseEvents.keys(), ...sourceEvents.keys(), ...targetEvents.keys()]).forEach((eventId) => {
      const baseEvent = baseEvents.get(eventId);
      const sourceEvent = sourceEvents.get(eventId);
      const targetEvent = targetEvents.get(eventId);
      if (stable(sourceEvent) === stable(baseEvent)) return;
      if (stable(targetEvent) === stable(baseEvent)) {
        if (sourceEvent) mergedEvents.set(eventId, clone(sourceEvent));
        else mergedEvents.delete(eventId);
        return;
      }
      if (stable(sourceEvent) === stable(targetEvent)) return;
      if (!sourceEvent || !targetEvent || !baseEvent) {
        conflicts.push({ eventId, field: "$", base: clone(baseEvent), source: clone(sourceEvent), target: clone(targetEvent) });
        return;
      }
      const sourceFields = changedFields(baseEvent, sourceEvent);
      const targetFields = new Set(changedFields(baseEvent, targetEvent));
      const merged = clone(targetEvent) as TimelineEvent;
      sourceFields.forEach((field) => {
        const key = field as keyof TimelineEvent;
        if (targetFields.has(field) && stable(sourceEvent[key]) !== stable(targetEvent[key])) {
          conflicts.push({ eventId, field, base: clone(baseEvent[key]), source: clone(sourceEvent[key]), target: clone(targetEvent[key]) });
        } else {
          (merged as unknown as Record<string, unknown>)[field] = clone(sourceEvent[key]);
        }
      });
      mergedEvents.set(eventId, merged);
    });
    return {
      sourceBranchId,
      targetBranchId,
      baseVersionId: base?.id ?? null,
      sourceVersionId: source.id,
      targetVersionId: target.id,
      conflicts,
      mergedWorkspace: { ...clone(target.workspace), events: Array.from(mergedEvents.values()) },
      canMerge: conflicts.length === 0,
    };
  }

  completeMerge(plan: TimelineMergePlan, createdBy: TimelineUserId, label: string): TimelineVersion {
    if (!plan.canMerge) throw new Error("Merge conflicts must be resolved before completion.");
    return this.createVersion(plan.targetBranchId, plan.mergedWorkspace, createdBy, label, {
      mergeParentVersionId: plan.sourceVersionId,
      tags: ["merge"],
    });
  }

  listBranches(): TimelineBranch[] {
    return Array.from(this.branches.values()).map(clone);
  }

  listVersions(branchId?: TimelineId): TimelineVersion[] {
    return Array.from(this.versions.values())
      .filter((version) => !branchId || version.branchId === branchId)
      .map(clone);
  }

  reset(): void {
    this.versions.clear();
    this.branches.clear();
    this.versionSequence = 0;
  }
}

export const timelineVersionEngine = new TimelineVersionEngine();
