import {
  TimelineEventLifecycleEngine,
  type TimelineEventDraft,
  type TimelineEventLifecycleResult,
} from "./TimelineEventLifecycleEngine";
import type {
  TimelineId,
  TimelineUserId,
  TimelineWorkspace,
} from "./TimelineTypes";

export type TimelineEventDependency = {
  id: TimelineId;
  projectId: TimelineId;
  dependentEventId: TimelineId;
  requiredEventId: TimelineId;
  createdAt: string;
  createdBy: TimelineUserId;
};

export type TimelineEventDependencyIssue = {
  code:
    | "draft-not-found"
    | "wrong-project"
    | "self-dependency"
    | "missing-dependency"
    | "dependency-not-active"
    | "draft-not-validated"
    | "dependency-cycle"
    | "activation-failed";
  message: string;
  eventId?: TimelineId;
  requiredEventId?: TimelineId;
  cycle?: TimelineId[];
};

export type TimelineEventDependencyPlan = {
  projectId: TimelineId;
  ready: boolean;
  requestedDraftIds: TimelineId[];
  includedDraftIds: TimelineId[];
  activationOrder: TimelineId[];
  dependencies: TimelineEventDependency[];
  issues: TimelineEventDependencyIssue[];
  generatedAt: string;
};

export type TimelineEventDependencyActivation = {
  accepted: boolean;
  plan: TimelineEventDependencyPlan;
  workspace: TimelineWorkspace;
  activatedDraftIds: TimelineId[];
  results: TimelineEventLifecycleResult[];
  issues: TimelineEventDependencyIssue[];
};

const ACTIVE_DEPENDENCY_STATUSES = new Set([
  "active",
  "approved",
  "completed",
  "processing",
  "recording",
]);

function clone<T>(value: T): T {
  return structuredClone(value);
}

export class TimelineEventDependencyEngine {
  private readonly dependencies = new Map<
    TimelineId,
    TimelineEventDependency
  >();
  private sequence = 0;

  constructor(private readonly now: () => Date = () => new Date()) {}

  addDependency(input: {
    projectId: TimelineId;
    dependentEventId: TimelineId;
    requiredEventId: TimelineId;
    createdBy: TimelineUserId;
  }): TimelineEventDependency {
    if (!input.dependentEventId.trim() || !input.requiredEventId.trim()) {
      throw new Error("Dependent and required event IDs are required.");
    }
    if (input.dependentEventId === input.requiredEventId) {
      throw new Error("An event cannot depend on itself.");
    }
    const duplicate = Array.from(this.dependencies.values()).find(
      (dependency) =>
        dependency.projectId === input.projectId &&
        dependency.dependentEventId === input.dependentEventId &&
        dependency.requiredEventId === input.requiredEventId,
    );
    if (duplicate) return clone(duplicate);
    const dependency: TimelineEventDependency = {
      id: `timeline-event-dependency-${++this.sequence}`,
      projectId: input.projectId,
      dependentEventId: input.dependentEventId,
      requiredEventId: input.requiredEventId,
      createdAt: this.now().toISOString(),
      createdBy: input.createdBy,
    };
    this.dependencies.set(dependency.id, dependency);
    return clone(dependency);
  }

  removeDependency(dependencyId: TimelineId): boolean {
    return this.dependencies.delete(dependencyId);
  }

  listDependencies(projectId?: TimelineId): TimelineEventDependency[] {
    return Array.from(this.dependencies.values())
      .filter((dependency) => !projectId || dependency.projectId === projectId)
      .map(clone);
  }

  plan(input: {
    workspace: TimelineWorkspace;
    drafts: TimelineEventDraft[];
    draftIds?: TimelineId[];
  }): TimelineEventDependencyPlan {
    const { workspace } = input;
    const projectDrafts = input.drafts.filter(
      (draft) =>
        draft.projectId === workspace.projectId && draft.lifecycle !== "active",
    );
    const draftById = new Map(projectDrafts.map((draft) => [draft.id, draft]));
    const draftByEventId = new Map(
      projectDrafts.map((draft) => [draft.event.id, draft]),
    );
    const dependencies = this.listDependencies(workspace.projectId);
    const requestedDraftIds = input.draftIds?.length
      ? Array.from(new Set(input.draftIds))
      : projectDrafts.map((draft) => draft.id);
    const issues: TimelineEventDependencyIssue[] = [];
    const included = new Set<TimelineId>();

    const includeDraft = (draftId: TimelineId) => {
      if (included.has(draftId)) return;
      const draft = draftById.get(draftId);
      if (!draft) {
        issues.push({
          code: "draft-not-found",
          message: `Held draft ${draftId} does not exist in project ${workspace.projectId}.`,
        });
        return;
      }
      included.add(draftId);
      for (const dependency of dependencies.filter(
        (item) => item.dependentEventId === draft.event.id,
      )) {
        const requiredDraft = draftByEventId.get(dependency.requiredEventId);
        if (requiredDraft) includeDraft(requiredDraft.id);
      }
    };
    requestedDraftIds.forEach(includeDraft);

    const includedDrafts = Array.from(included)
      .map((draftId) => draftById.get(draftId))
      .filter((draft): draft is TimelineEventDraft => Boolean(draft));
    for (const draft of includedDrafts) {
      if (draft.lifecycle !== "validated") {
        issues.push({
          code: "draft-not-validated",
          eventId: draft.event.id,
          message: `Event ${draft.event.id} is ${draft.lifecycle}; every grouped draft must be validated before activation.`,
        });
      }
      for (const dependency of dependencies.filter(
        (item) => item.dependentEventId === draft.event.id,
      )) {
        const requiredDraft = draftByEventId.get(dependency.requiredEventId);
        if (requiredDraft) continue;
        const live = workspace.events.find(
          (event) => event.id === dependency.requiredEventId,
        );
        if (!live) {
          issues.push({
            code: "missing-dependency",
            eventId: draft.event.id,
            requiredEventId: dependency.requiredEventId,
            message: `Event ${draft.event.id} requires ${dependency.requiredEventId}, but that event is neither live nor held.`,
          });
        } else if (
          !ACTIVE_DEPENDENCY_STATUSES.has(live.status) ||
          live.archived ||
          !live.enabled
        ) {
          issues.push({
            code: "dependency-not-active",
            eventId: draft.event.id,
            requiredEventId: dependency.requiredEventId,
            message: `Required event ${dependency.requiredEventId} exists but is not active and usable.`,
          });
        }
      }
    }

    const includedEvents = new Set(
      includedDrafts.map((draft) => draft.event.id),
    );
    const graph = new Map<TimelineId, TimelineId[]>();
    for (const eventId of includedEvents) graph.set(eventId, []);
    for (const dependency of dependencies) {
      if (
        includedEvents.has(dependency.dependentEventId) &&
        includedEvents.has(dependency.requiredEventId)
      ) {
        graph
          .get(dependency.requiredEventId)!
          .push(dependency.dependentEventId);
      }
    }

    const visiting = new Set<TimelineId>();
    const visited = new Set<TimelineId>();
    const order: TimelineId[] = [];
    const cycles = new Set<string>();
    const visit = (eventId: TimelineId, path: TimelineId[]) => {
      if (visiting.has(eventId)) {
        const start = path.indexOf(eventId);
        const cycle = [...path.slice(start), eventId];
        const key = [...new Set(cycle)].sort().join("|");
        if (!cycles.has(key)) {
          cycles.add(key);
          issues.push({
            code: "dependency-cycle",
            eventId,
            cycle,
            message: `Held-event dependency cycle: ${cycle.join(" -> ")}.`,
          });
        }
        return;
      }
      if (visited.has(eventId)) return;
      visiting.add(eventId);
      path.push(eventId);
      for (const dependent of graph.get(eventId) ?? []) visit(dependent, path);
      path.pop();
      visiting.delete(eventId);
      visited.add(eventId);
      order.push(eventId);
    };
    for (const eventId of includedEvents) visit(eventId, []);
    order.reverse();
    const activationOrder = order
      .map((eventId) => draftByEventId.get(eventId)?.id)
      .filter((draftId): draftId is TimelineId => Boolean(draftId));

    return {
      projectId: workspace.projectId,
      ready: issues.length === 0,
      requestedDraftIds,
      includedDraftIds: includedDrafts.map((draft) => draft.id),
      activationOrder,
      dependencies,
      issues,
      generatedAt: this.now().toISOString(),
    };
  }

  activate(input: {
    workspace: TimelineWorkspace;
    lifecycle: TimelineEventLifecycleEngine;
    draftIds?: TimelineId[];
    activatedBy: TimelineUserId;
  }): TimelineEventDependencyActivation {
    const checkpoint = input.lifecycle.exportDrafts();
    const plan = this.plan({
      workspace: input.workspace,
      drafts: checkpoint,
      draftIds: input.draftIds,
    });
    if (!plan.ready) {
      return {
        accepted: false,
        plan,
        workspace: clone(input.workspace),
        activatedDraftIds: [],
        results: [],
        issues: clone(plan.issues),
      };
    }

    let workspace = clone(input.workspace);
    const results: TimelineEventLifecycleResult[] = [];
    const activatedDraftIds: TimelineId[] = [];
    for (const draftId of plan.activationOrder) {
      const result = input.lifecycle.activateDraft({
        draftId,
        workspace,
        activatedBy: input.activatedBy,
      });
      results.push(result);
      if (!result.accepted) {
        input.lifecycle.restoreDrafts(checkpoint);
        return {
          accepted: false,
          plan,
          workspace: clone(input.workspace),
          activatedDraftIds: [],
          results,
          issues: [
            {
              code: "activation-failed",
              message:
                result.issues[0]?.message ??
                `Grouped activation failed at draft ${draftId}.`,
            },
          ],
        };
      }
      workspace = result.workspace;
      activatedDraftIds.push(draftId);
    }
    return {
      accepted: true,
      plan,
      workspace,
      activatedDraftIds,
      results,
      issues: [],
    };
  }

  restore(dependencies: TimelineEventDependency[]): void {
    this.dependencies.clear();
    for (const dependency of dependencies) {
      this.dependencies.set(dependency.id, clone(dependency));
      this.sequence = Math.max(
        this.sequence,
        Number(dependency.id.match(/(\d+)$/)?.[1] ?? 0),
      );
    }
  }
}
