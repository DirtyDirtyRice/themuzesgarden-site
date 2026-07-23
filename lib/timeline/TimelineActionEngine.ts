import type { TimelineAIProposal } from "./TimelineAIEngine";
import {
  TimelineValidationEngine,
  type TimelineDetailedValidationIssue,
} from "./TimelineValidationEngine";
import type {
  TimelineEvent,
  TimelineHistoryEntry,
  TimelineId,
  TimelineProjectId,
  TimelineStatistics,
  TimelineTrack,
  TimelineUserId,
  TimelineWorkspace,
} from "./TimelineTypes";

export type TimelineActionKind =
  | "update-event"
  | "move-event"
  | "archive-event"
  | "restore-event"
  | "add-event-tags"
  | "remove-event-tags"
  | "update-track";

export type TimelineActionPlanStatus =
  | "ready"
  | "blocked"
  | "applied"
  | "reverted";

export type TimelineActionChange = {
  entity: "event" | "track" | "workspace";
  entityId: TimelineId;
  field: string;
  before: unknown;
  after: unknown;
};

export type TimelineActionPlan = {
  id: TimelineId;
  projectId: TimelineProjectId;
  proposalIds: TimelineId[];
  status: TimelineActionPlanStatus;
  changes: TimelineActionChange[];
  issues: TimelineActionIssue[];
  previewWorkspace: TimelineWorkspace | null;
  createdAt: string;
  createdBy: TimelineUserId;
};

export type TimelineActionIssue = {
  proposalId: TimelineId;
  code:
    | "unsupported-kind"
    | "wrong-project"
    | "invalid-status"
    | "missing-target"
    | "locked-target"
    | "invalid-payload"
    | "protected-field"
    | "validation-failed";
  message: string;
  blocking: true;
  path?: string;
};

export type TimelineActionReceipt = {
  id: TimelineId;
  planId: TimelineId;
  projectId: TimelineProjectId;
  status: "applied" | "reverted";
  proposalIds: TimelineId[];
  changes: TimelineActionChange[];
  beforeWorkspace: TimelineWorkspace;
  afterWorkspace: TimelineWorkspace;
  appliedAt: string;
  appliedBy: TimelineUserId;
  revertedAt?: string;
  revertedBy?: TimelineUserId;
};

type MutableEventField =
  | "title"
  | "summary"
  | "content"
  | "notes"
  | "lyric"
  | "prompt"
  | "response"
  | "analysis"
  | "idea"
  | "comment"
  | "task"
  | "marker"
  | "chord"
  | "genre"
  | "mood"
  | "section"
  | "bpm"
  | "confidence"
  | "importance"
  | "energy"
  | "valence"
  | "priority"
  | "visibility"
  | "status"
  | "enabled"
  | "hidden"
  | "pinned"
  | "favorite"
  | "completed";

const MUTABLE_EVENT_FIELDS = new Set<MutableEventField>([
  "title",
  "summary",
  "content",
  "notes",
  "lyric",
  "prompt",
  "response",
  "analysis",
  "idea",
  "comment",
  "task",
  "marker",
  "chord",
  "genre",
  "mood",
  "section",
  "bpm",
  "confidence",
  "importance",
  "energy",
  "valence",
  "priority",
  "visibility",
  "status",
  "enabled",
  "hidden",
  "pinned",
  "favorite",
  "completed",
]);

const PROTECTED_EVENT_FIELDS = new Set([
  "id",
  "projectId",
  "type",
  "source",
  "audit",
  "attachments",
  "relationships",
  "aiGenerated",
  "aiModel",
  "aiProvider",
]);

const SUPPORTED_ACTIONS = new Set<TimelineActionKind>([
  "update-event",
  "move-event",
  "archive-event",
  "restore-event",
  "add-event-tags",
  "remove-event-tags",
  "update-track",
]);

function clone<T>(value: T): T {
  return structuredClone(value);
}

function sameValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function statistics(events: TimelineEvent[]): TimelineStatistics {
  return {
    totalEvents: events.length,
    promptEvents: events.filter((event) => event.type === "prompt").length,
    lyricEvents: events.filter((event) => event.type === "lyric").length,
    markerEvents: events.filter((event) => event.type === "marker").length,
    automationEvents: events.filter((event) => event.type === "automation").length,
    relationshipEvents: events.filter((event) => event.type === "relationship").length,
    audioEvents: events.filter((event) => event.type === "audio").length,
    videoEvents: events.filter((event) => event.type === "video").length,
    imageEvents: events.filter((event) => event.type === "image").length,
    aiEvents: events.filter((event) => event.aiGenerated).length,
  };
}

function issue(
  proposalId: TimelineId,
  code: TimelineActionIssue["code"],
  message: string,
  path?: string
): TimelineActionIssue {
  return { proposalId, code, message, blocking: true, path };
}

function recordChange(
  changes: TimelineActionChange[],
  entity: TimelineActionChange["entity"],
  entityId: TimelineId,
  field: string,
  before: unknown,
  after: unknown
): void {
  if (sameValue(before, after)) return;
  changes.push({
    entity,
    entityId,
    field,
    before: clone(before),
    after: clone(after),
  });
}

function stringArray(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    return null;
  }
  return value.map((item) => item.trim()).filter(Boolean);
}

function tagLabel(tag: TimelineEvent["tags"][number]): string {
  return typeof tag === "string" ? tag : tag.label;
}

function actionHistory(
  planId: TimelineId,
  userId: TimelineUserId,
  eventIds: TimelineId[],
  timestamp: string
): TimelineHistoryEntry {
  return {
    id: `timeline-action-history-${planId}`,
    action: "apply-ai-action-plan",
    timestamp,
    userId,
    eventIds: Array.from(new Set(eventIds)),
  };
}

export class TimelineActionEngine {
  private readonly plans = new Map<TimelineId, TimelineActionPlan>();
  private readonly receipts = new Map<TimelineId, TimelineActionReceipt>();
  private planSequence = 0;
  private receiptSequence = 0;

  constructor(
    private readonly validator = new TimelineValidationEngine(),
    private readonly now: () => Date = () => new Date()
  ) {}

  preview(input: {
    workspace: TimelineWorkspace;
    proposals: TimelineAIProposal[];
    createdBy: TimelineUserId;
  }): TimelineActionPlan {
    this.planSequence += 1;
    const planId = `timeline-action-plan-${this.planSequence}`;
    const candidate = clone(input.workspace);
    const baselineBlockingIssues = new Set(
      this.validator
        .validateWorkspace(input.workspace)
        .detailedIssues.filter((candidateIssue) => candidateIssue.blocking)
        .map((candidateIssue) => this.validationFingerprint(candidateIssue))
    );
    const changes: TimelineActionChange[] = [];
    const issues: TimelineActionIssue[] = [];

    if (!input.proposals.length) {
      issues.push(issue(planId, "invalid-payload", "At least one proposal is required."));
    }
    for (const proposal of input.proposals) {
      this.previewProposal(candidate, proposal, input.createdBy, changes, issues);
    }
    candidate.statistics = statistics(candidate.events);

    if (!issues.length) {
      const report = this.validator.validateWorkspace(candidate);
      for (const validationIssue of report.detailedIssues.filter(
        (candidateIssue) =>
          candidateIssue.blocking &&
          !baselineBlockingIssues.has(this.validationFingerprint(candidateIssue))
      )) {
        issues.push(this.validationIssue(input.proposals, validationIssue));
      }
    }

    const plan: TimelineActionPlan = {
      id: planId,
      projectId: input.workspace.projectId,
      proposalIds: input.proposals.map((proposal) => proposal.id),
      status: issues.length ? "blocked" : "ready",
      changes,
      issues,
      previewWorkspace: issues.length ? null : candidate,
      createdAt: this.now().toISOString(),
      createdBy: input.createdBy,
    };
    this.plans.set(plan.id, plan);
    return this.clonePlan(plan);
  }

  apply(input: {
    planId: TimelineId;
    workspace: TimelineWorkspace;
    proposals: TimelineAIProposal[];
    appliedBy: TimelineUserId;
  }): TimelineActionReceipt {
    const plan = this.requirePlan(input.planId);
    if (plan.status !== "ready" || !plan.previewWorkspace) {
      throw new Error("Only a ready action plan can be applied.");
    }
    if (input.workspace.projectId !== plan.projectId) {
      throw new Error("Action plan project does not match the current workspace.");
    }
    if (
      input.proposals.length !== plan.proposalIds.length ||
      plan.proposalIds.some(
        (proposalId) =>
          !input.proposals.some(
            (proposal) => proposal.id === proposalId && proposal.status === "validated"
          )
      )
    ) {
      throw new Error("Every action proposal must be validated before application.");
    }

    const beforeWorkspace = clone(input.workspace);
    const afterWorkspace = clone(plan.previewWorkspace);
    const appliedAt = this.now().toISOString();
    const affectedEventIds = plan.changes
      .filter((change) => change.entity === "event")
      .map((change) => change.entityId);
    afterWorkspace.history.push(
      actionHistory(plan.id, input.appliedBy, affectedEventIds, appliedAt)
    );
    plan.status = "applied";
    this.receiptSequence += 1;
    const receipt: TimelineActionReceipt = {
      id: `timeline-action-receipt-${this.receiptSequence}`,
      planId: plan.id,
      projectId: plan.projectId,
      status: "applied",
      proposalIds: [...plan.proposalIds],
      changes: clone(plan.changes),
      beforeWorkspace,
      afterWorkspace,
      appliedAt,
      appliedBy: input.appliedBy,
    };
    this.receipts.set(receipt.id, receipt);
    return clone(receipt);
  }

  revert(receiptId: TimelineId, revertedBy: TimelineUserId): TimelineActionReceipt {
    const receipt = this.requireReceipt(receiptId);
    if (receipt.status !== "applied") throw new Error("Receipt is already reverted.");
    receipt.status = "reverted";
    receipt.revertedAt = this.now().toISOString();
    receipt.revertedBy = revertedBy;
    const plan = this.requirePlan(receipt.planId);
    plan.status = "reverted";
    return clone(receipt);
  }

  getPlan(planId: TimelineId): TimelineActionPlan | null {
    const plan = this.plans.get(planId);
    return plan ? this.clonePlan(plan) : null;
  }

  getReceipt(receiptId: TimelineId): TimelineActionReceipt | null {
    const receipt = this.receipts.get(receiptId);
    return receipt ? clone(receipt) : null;
  }

  private previewProposal(
    workspace: TimelineWorkspace,
    proposal: TimelineAIProposal,
    userId: TimelineUserId,
    changes: TimelineActionChange[],
    issues: TimelineActionIssue[]
  ): void {
    if (proposal.projectId !== workspace.projectId) {
      issues.push(issue(proposal.id, "wrong-project", "Proposal belongs to another project."));
      return;
    }
    if (proposal.status !== "held" && proposal.status !== "validated") {
      issues.push(
        issue(proposal.id, "invalid-status", `Proposal status ${proposal.status} cannot be previewed.`)
      );
      return;
    }
    if (!SUPPORTED_ACTIONS.has(proposal.kind as TimelineActionKind)) {
      issues.push(
        issue(proposal.id, "unsupported-kind", `Action kind ${proposal.kind} is not allowed.`)
      );
      return;
    }
    if (!proposal.targetId) {
      issues.push(issue(proposal.id, "missing-target", "Action target ID is required."));
      return;
    }

    if (proposal.kind === "update-track") {
      this.updateTrack(workspace, proposal, changes, issues);
      return;
    }
    const event = workspace.events.find((candidate) => candidate.id === proposal.targetId);
    if (!event) {
      issues.push(
        issue(proposal.id, "missing-target", `Event ${proposal.targetId} does not exist.`)
      );
      return;
    }
    if (event.locked) {
      issues.push(issue(proposal.id, "locked-target", `Event ${event.id} is locked.`));
      return;
    }

    switch (proposal.kind as TimelineActionKind) {
      case "update-event":
        this.updateEvent(event, proposal, changes, issues);
        break;
      case "move-event":
        this.moveEvent(workspace, event, proposal, changes, issues);
        break;
      case "archive-event":
        recordChange(changes, "event", event.id, "archived", event.archived, true);
        event.archived = true;
        break;
      case "restore-event":
        recordChange(changes, "event", event.id, "archived", event.archived, false);
        event.archived = false;
        break;
      case "add-event-tags":
      case "remove-event-tags":
        this.changeTags(event, proposal, changes, issues);
        break;
    }
    if (!issues.some((candidate) => candidate.proposalId === proposal.id)) {
      const before = clone(event.audit);
      event.audit.updatedAt = this.now().toISOString();
      event.audit.updatedBy = userId;
      recordChange(changes, "event", event.id, "audit", before, event.audit);
    }
  }

  private updateEvent(
    event: TimelineEvent,
    proposal: TimelineAIProposal,
    changes: TimelineActionChange[],
    issues: TimelineActionIssue[]
  ): void {
    const entries = Object.entries(proposal.payload);
    if (!entries.length) {
      issues.push(issue(proposal.id, "invalid-payload", "Update payload is empty."));
      return;
    }
    for (const [field, value] of entries) {
      if (PROTECTED_EVENT_FIELDS.has(field) || !MUTABLE_EVENT_FIELDS.has(field as MutableEventField)) {
        issues.push(
          issue(
            proposal.id,
            "protected-field",
            `Event field ${field} cannot be changed by AI.`,
            `events.${event.id}.${field}`
          )
        );
        continue;
      }
      const before = (event as unknown as Record<string, unknown>)[field];
      recordChange(changes, "event", event.id, field, before, value);
      (event as unknown as Record<string, unknown>)[field] = clone(value);
      if (field === "title") event.metadata.title = String(value);
    }
  }

  private moveEvent(
    workspace: TimelineWorkspace,
    event: TimelineEvent,
    proposal: TimelineAIProposal,
    changes: TimelineActionChange[],
    issues: TimelineActionIssue[]
  ): void {
    const trackId =
      typeof proposal.payload.trackId === "string"
        ? proposal.payload.trackId.trim()
        : event.trackId;
    const seconds = proposal.payload.seconds;
    if (!workspace.tracks.some((track) => track.id === trackId)) {
      issues.push(issue(proposal.id, "invalid-payload", `Track ${trackId} does not exist.`));
      return;
    }
    if (seconds !== undefined && (typeof seconds !== "number" || seconds < 0)) {
      issues.push(issue(proposal.id, "invalid-payload", "Move seconds must be zero or greater."));
      return;
    }
    recordChange(changes, "event", event.id, "trackId", event.trackId, trackId);
    event.trackId = trackId;
    if (typeof seconds === "number") {
      recordChange(
        changes,
        "event",
        event.id,
        "location.seconds",
        event.location.seconds,
        seconds
      );
      event.location.seconds = seconds;
      event.location.milliseconds = Math.round(seconds * 1000);
    }
  }

  private changeTags(
    event: TimelineEvent,
    proposal: TimelineAIProposal,
    changes: TimelineActionChange[],
    issues: TimelineActionIssue[]
  ): void {
    const tags = stringArray(proposal.payload.tags);
    if (!tags?.length) {
      issues.push(issue(proposal.id, "invalid-payload", "A non-empty tags array is required."));
      return;
    }
    const before = clone(event.tags);
    if (proposal.kind === "add-event-tags") {
      const existing = new Set(
        event.tags.map((tag) => tagLabel(tag).toLowerCase())
      );
      event.tags.push(...tags.filter((tag) => !existing.has(tag.toLowerCase())));
    } else {
      const removed = new Set(tags.map((tag) => tag.toLowerCase()));
      event.tags = event.tags.filter(
        (tag) => !removed.has(tagLabel(tag).toLowerCase())
      );
    }
    recordChange(changes, "event", event.id, "tags", before, event.tags);
  }

  private updateTrack(
    workspace: TimelineWorkspace,
    proposal: TimelineAIProposal,
    changes: TimelineActionChange[],
    issues: TimelineActionIssue[]
  ): void {
    const track = workspace.tracks.find((candidate) => candidate.id === proposal.targetId);
    if (!track) {
      issues.push(
        issue(proposal.id, "missing-target", `Track ${proposal.targetId} does not exist.`)
      );
      return;
    }
    if (track.locked) {
      issues.push(issue(proposal.id, "locked-target", `Track ${track.id} is locked.`));
      return;
    }
    const allowed = new Set<keyof TimelineTrack>(["title", "color", "visible", "muted", "height"]);
    const entries = Object.entries(proposal.payload);
    if (!entries.length) {
      issues.push(issue(proposal.id, "invalid-payload", "Track update payload is empty."));
      return;
    }
    for (const [field, value] of entries) {
      if (!allowed.has(field as keyof TimelineTrack)) {
        issues.push(
          issue(
            proposal.id,
            "protected-field",
            `Track field ${field} cannot be changed by AI.`,
            `tracks.${track.id}.${field}`
          )
        );
        continue;
      }
      const before = (track as unknown as Record<string, unknown>)[field];
      recordChange(changes, "track", track.id, field, before, value);
      (track as unknown as Record<string, unknown>)[field] = clone(value);
    }
  }

  private validationIssue(
    proposals: TimelineAIProposal[],
    validationIssue: TimelineDetailedValidationIssue
  ): TimelineActionIssue {
    const proposal =
      proposals.find((candidate) => candidate.targetId === validationIssue.entityId) ??
      proposals[0];
    return issue(
      proposal?.id ?? "workspace",
      "validation-failed",
      validationIssue.message,
      validationIssue.path
    );
  }

  private validationFingerprint(issue: TimelineDetailedValidationIssue): string {
    return `${issue.code}:${issue.path}:${issue.message}`;
  }

  private requirePlan(planId: TimelineId): TimelineActionPlan {
    const plan = this.plans.get(planId);
    if (!plan) throw new Error(`Timeline action plan ${planId} does not exist.`);
    return plan;
  }

  private requireReceipt(receiptId: TimelineId): TimelineActionReceipt {
    const receipt = this.receipts.get(receiptId);
    if (!receipt) throw new Error(`Timeline action receipt ${receiptId} does not exist.`);
    return receipt;
  }

  private clonePlan(plan: TimelineActionPlan): TimelineActionPlan {
    return clone(plan);
  }
}

