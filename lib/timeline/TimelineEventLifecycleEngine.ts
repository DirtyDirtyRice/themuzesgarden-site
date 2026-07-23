import {
  TimelineValidationEngine,
  type TimelineDetailedValidationIssue,
  type TimelineDetailedValidationReport,
  type TimelineLifecycleState,
} from "./TimelineValidationEngine";
import type {
  TimelineEvent,
  TimelineEventType,
  TimelineId,
  TimelinePriority,
  TimelineStatistics,
  TimelineSource,
  TimelineUserId,
  TimelineVisibility,
  TimelineWorkspace,
} from "./TimelineTypes";

export type TimelineEditableEventType =
  | "note"
  | "lyric"
  | "marker"
  | "idea"
  | "comment"
  | "task"
  | "prompt"
  | "response"
  | "analysis";

export type TimelineEventDraftPatch = {
  trackId?: TimelineId;
  type?: TimelineEditableEventType;
  title?: string;
  content?: string;
  summary?: string;
  notes?: string;
  seconds?: number;
  visibility?: TimelineVisibility;
  priority?: TimelinePriority;
  tags?: string[];
  description?: string;
  color?: string;
};

export type TimelineEventLifecycleTransition = {
  id: TimelineId;
  from: TimelineLifecycleState | null;
  to: TimelineLifecycleState;
  at: string;
  by: TimelineUserId;
  reason: string;
};

export type TimelineEventValidationAttempt = {
  id: TimelineId;
  at: string;
  by: TimelineUserId;
  accepted: boolean;
  lifecycle: TimelineLifecycleState;
  issues: TimelineDetailedValidationIssue[];
};

export type TimelineEventDraft = {
  id: TimelineId;
  projectId: TimelineId;
  lifecycle: TimelineLifecycleState;
  event: TimelineEvent;
  originEventId?: TimelineId;
  originFingerprint?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: TimelineUserId;
  updatedBy: TimelineUserId;
  validationAttempts: TimelineEventValidationAttempt[];
  transitions: TimelineEventLifecycleTransition[];
  lastValidationReport: TimelineDetailedValidationReport | null;
};

export type TimelineEventLifecycleIssue = {
  code:
    | "draft-not-found"
    | "wrong-project"
    | "not-validated"
    | "duplicate-event"
    | "event-not-found"
    | "locked-event"
    | "locked-track"
    | "stale-edit";
  message: string;
};

export type TimelineEventLifecycleResult = {
  accepted: boolean;
  lifecycle: TimelineLifecycleState;
  draft: TimelineEventDraft | null;
  workspace: TimelineWorkspace;
  issues: TimelineEventLifecycleIssue[];
};

export type TimelineEventHoldingSnapshot = {
  generatedAt: string;
  drafts: TimelineEventDraft[];
  heldCount: number;
  validationAttemptCount: number;
  preventedActivationCount: number;
};

const EDITABLE_EVENT_TYPES = new Set<TimelineEventType>([
  "note",
  "lyric",
  "marker",
  "idea",
  "comment",
  "task",
  "prompt",
  "response",
  "analysis",
]);

function clone<T>(value: T): T {
  return structuredClone(value);
}

function fingerprint(event: TimelineEvent): string {
  return JSON.stringify(event);
}

function statistics(events: TimelineEvent[]): TimelineStatistics {
  return {
    totalEvents: events.length,
    promptEvents: events.filter((event) => event.type === "prompt").length,
    lyricEvents: events.filter((event) => event.type === "lyric").length,
    markerEvents: events.filter((event) => event.type === "marker").length,
    automationEvents: events.filter((event) => event.type === "automation")
      .length,
    relationshipEvents: events.filter((event) => event.type === "relationship")
      .length,
    audioEvents: events.filter((event) => event.type === "audio").length,
    videoEvents: events.filter((event) => event.type === "video").length,
    imageEvents: events.filter((event) => event.type === "image").length,
    aiEvents: events.filter((event) => event.aiGenerated).length,
  };
}

function applyContent(event: TimelineEvent, content: string): TimelineEvent {
  const next: TimelineEvent = {
    ...event,
    content,
    note: undefined,
    lyric: undefined,
    marker: undefined,
    idea: undefined,
    comment: undefined,
    task: undefined,
    prompt: undefined,
    response: undefined,
    analysis: undefined,
  };

  switch (event.type) {
    case "note":
      next.note = content;
      break;
    case "lyric":
      next.lyric = content;
      break;
    case "marker":
      next.marker = content;
      break;
    case "idea":
      next.idea = content;
      break;
    case "comment":
      next.comment = content;
      break;
    case "task":
      next.task = content;
      break;
    case "prompt":
      next.prompt = content;
      break;
    case "response":
      next.response = content;
      break;
    case "analysis":
      next.analysis = content;
      break;
  }

  return next;
}

function draftEvent(input: {
  id: TimelineId;
  projectId: TimelineId;
  trackId: TimelineId;
  createdBy: TimelineUserId;
  now: string;
  source?: TimelineSource;
  aiModel?: string;
  aiProvider?: string;
  patch?: TimelineEventDraftPatch;
}): TimelineEvent {
  const type = input.patch?.type ?? "note";
  const title = input.patch?.title?.trim() ?? "";
  const content = input.patch?.content ?? "";
  const seconds = input.patch?.seconds ?? 0;
  const base: TimelineEvent = {
    id: input.id,
    trackId: input.patch?.trackId ?? input.trackId,
    projectId: input.projectId,
    type,
    status: "draft",
    source: input.source ?? "user",
    visibility: input.patch?.visibility ?? "project",
    priority: input.patch?.priority ?? "normal",
    location: {
      seconds,
      milliseconds: Math.round(seconds * 1000),
      bar: 1,
      beat: 1,
      tick: 0,
    },
    metadata: {
      title,
      description: input.patch?.description ?? "",
      category: type,
      color: input.patch?.color ?? "#38bdf8",
      icon: "timeline-event",
    },
    tags: [...(input.patch?.tags ?? [])],
    attachments: [],
    relationships: [],
    audit: {
      createdAt: input.now,
      updatedAt: input.now,
      createdBy: input.createdBy,
      updatedBy: input.createdBy,
    },
    title,
    summary: input.patch?.summary,
    notes: input.patch?.notes,
    locked: false,
    pinned: false,
    favorite: false,
    archived: false,
    selected: false,
    enabled: true,
    hidden: false,
    completed: false,
    aiGenerated: input.source === "ai",
    aiModel: input.aiModel,
    aiProvider: input.aiProvider,
  };
  return applyContent(base, content);
}

function patchEvent(
  current: TimelineEvent,
  patch: TimelineEventDraftPatch,
  updatedBy: TimelineUserId,
  now: string,
): TimelineEvent {
  const type =
    patch.type && EDITABLE_EVENT_TYPES.has(patch.type)
      ? patch.type
      : current.type;
  const title = patch.title === undefined ? current.title : patch.title.trim();
  const seconds = patch.seconds ?? current.location.seconds;
  let next: TimelineEvent = {
    ...current,
    trackId: patch.trackId ?? current.trackId,
    type,
    title,
    summary: patch.summary === undefined ? current.summary : patch.summary,
    notes: patch.notes === undefined ? current.notes : patch.notes,
    visibility: patch.visibility ?? current.visibility,
    priority: patch.priority ?? current.priority,
    tags: patch.tags === undefined ? current.tags : [...patch.tags],
    location: {
      ...current.location,
      seconds,
      milliseconds: Math.round(seconds * 1000),
    },
    metadata: {
      ...current.metadata,
      title,
      category: type,
      description:
        patch.description === undefined
          ? current.metadata.description
          : patch.description,
      color: patch.color ?? current.metadata.color,
    },
    audit: {
      ...current.audit,
      updatedAt: now,
      updatedBy,
    },
    status: "draft",
  };

  if (patch.content !== undefined || type !== current.type) {
    next = applyContent(next, patch.content ?? current.content ?? "");
  }
  return next;
}

export class TimelineEventLifecycleEngine {
  private readonly drafts = new Map<TimelineId, TimelineEventDraft>();
  private draftSequence = 0;
  private transitionSequence = 0;
  private attemptSequence = 0;
  private preventedActivationCount = 0;

  constructor(
    private readonly validator = new TimelineValidationEngine(),
    private readonly now: () => Date = () => new Date(),
  ) {}

  createDraft(input: {
    workspace: TimelineWorkspace;
    createdBy: TimelineUserId;
    patch?: TimelineEventDraftPatch;
    source?: TimelineSource;
    aiModel?: string;
    aiProvider?: string;
  }): TimelineEventDraft {
    const now = this.now().toISOString();
    const id = `timeline-event-draft-${++this.draftSequence}`;
    const eventId = `timeline-event-${this.draftSequence}`;
    const event = draftEvent({
      id: eventId,
      projectId: input.workspace.projectId,
      trackId: input.workspace.tracks[0]?.id ?? "",
      createdBy: input.createdBy,
      now,
      source: input.source,
      aiModel: input.aiModel,
      aiProvider: input.aiProvider,
      patch: input.patch,
    });
    const draft: TimelineEventDraft = {
      id,
      projectId: input.workspace.projectId,
      lifecycle: "draft",
      event,
      createdAt: now,
      updatedAt: now,
      createdBy: input.createdBy,
      updatedBy: input.createdBy,
      validationAttempts: [],
      transitions: [
        this.transition(null, "draft", input.createdBy, "Draft created.", now),
      ],
      lastValidationReport: null,
    };
    this.drafts.set(id, draft);
    return clone(draft);
  }

  beginEdit(input: {
    workspace: TimelineWorkspace;
    eventId: TimelineId;
    createdBy: TimelineUserId;
  }): TimelineEventLifecycleResult {
    const original = input.workspace.events.find(
      (event) => event.id === input.eventId,
    );
    if (!original) {
      return this.failure(
        input.workspace,
        "draft",
        "event-not-found",
        `Event ${input.eventId} does not exist.`,
      );
    }
    if (original.locked) {
      return this.failure(
        input.workspace,
        "draft",
        "locked-event",
        `Event ${input.eventId} is locked.`,
      );
    }
    const now = this.now().toISOString();
    const id = `timeline-event-draft-${++this.draftSequence}`;
    const event = {
      ...clone(original),
      status: "draft" as const,
      audit: { ...original.audit, updatedAt: now, updatedBy: input.createdBy },
    };
    const draft: TimelineEventDraft = {
      id,
      projectId: input.workspace.projectId,
      lifecycle: "draft",
      event,
      originEventId: original.id,
      originFingerprint: fingerprint(original),
      createdAt: now,
      updatedAt: now,
      createdBy: input.createdBy,
      updatedBy: input.createdBy,
      validationAttempts: [],
      transitions: [
        this.transition(
          null,
          "draft",
          input.createdBy,
          `Edit started for ${original.id}.`,
          now,
        ),
      ],
      lastValidationReport: null,
    };
    this.drafts.set(id, draft);
    return {
      accepted: true,
      lifecycle: draft.lifecycle,
      draft: clone(draft),
      workspace: clone(input.workspace),
      issues: [],
    };
  }

  updateDraft(
    draftId: TimelineId,
    patch: TimelineEventDraftPatch,
    updatedBy: TimelineUserId,
  ): TimelineEventDraft | null {
    const current = this.drafts.get(draftId);
    if (!current) return null;
    const now = this.now().toISOString();
    const nextLifecycle: TimelineLifecycleState = "draft";
    const next: TimelineEventDraft = {
      ...current,
      lifecycle: nextLifecycle,
      event: patchEvent(current.event, patch, updatedBy, now),
      updatedAt: now,
      updatedBy,
      lastValidationReport: null,
      transitions:
        current.lifecycle === nextLifecycle
          ? current.transitions
          : [
              ...current.transitions,
              this.transition(
                current.lifecycle,
                nextLifecycle,
                updatedBy,
                "Draft changed and requires validation again.",
                now,
              ),
            ],
    };
    this.drafts.set(draftId, next);
    return clone(next);
  }

  validateDraft(input: {
    draftId: TimelineId;
    workspace: TimelineWorkspace;
    validatedBy: TimelineUserId;
  }): TimelineEventLifecycleResult {
    const current = this.drafts.get(input.draftId);
    if (!current) {
      return this.failure(
        input.workspace,
        "draft",
        "draft-not-found",
        `Draft ${input.draftId} does not exist.`,
      );
    }
    if (current.projectId !== input.workspace.projectId) {
      return this.failure(
        input.workspace,
        current.lifecycle,
        "wrong-project",
        "Draft belongs to another project.",
        current,
      );
    }

    const now = this.now().toISOString();
    const candidate = {
      ...clone(current.event),
      status: "active" as const,
      audit: {
        ...current.event.audit,
        updatedAt: now,
        updatedBy: input.validatedBy,
      },
    };
    const decision = this.validator.evaluateActivation(
      candidate,
      input.workspace,
    );
    const lifecycle: TimelineLifecycleState = decision.accepted
      ? "validated"
      : decision.lifecycle;
    const attempt: TimelineEventValidationAttempt = {
      id: `timeline-event-validation-${++this.attemptSequence}`,
      at: now,
      by: input.validatedBy,
      accepted: decision.accepted,
      lifecycle,
      issues: clone(decision.report.detailedIssues),
    };
    const next: TimelineEventDraft = {
      ...current,
      lifecycle,
      event: { ...candidate, status: decision.accepted ? "approved" : "draft" },
      updatedAt: now,
      updatedBy: input.validatedBy,
      validationAttempts: [...current.validationAttempts, attempt],
      transitions: [
        ...current.transitions,
        this.transition(
          current.lifecycle,
          lifecycle,
          input.validatedBy,
          decision.accepted
            ? "All activation rules passed."
            : `${decision.report.blockingIssueCount} blocking issue(s) kept the event in holding.`,
          now,
        ),
      ],
      lastValidationReport: clone(decision.report),
    };
    this.drafts.set(input.draftId, next);
    if (!decision.accepted) this.preventedActivationCount += 1;
    return {
      accepted: decision.accepted,
      lifecycle,
      draft: clone(next),
      workspace: clone(input.workspace),
      issues: [],
    };
  }

  activateDraft(input: {
    draftId: TimelineId;
    workspace: TimelineWorkspace;
    activatedBy: TimelineUserId;
  }): TimelineEventLifecycleResult {
    const current = this.drafts.get(input.draftId);
    if (!current) {
      return this.failure(
        input.workspace,
        "draft",
        "draft-not-found",
        `Draft ${input.draftId} does not exist.`,
      );
    }
    if (current.lifecycle !== "validated") {
      this.preventedActivationCount += 1;
      return this.failure(
        input.workspace,
        current.lifecycle,
        "not-validated",
        "Draft must pass validation before activation.",
        current,
      );
    }
    if (current.projectId !== input.workspace.projectId) {
      return this.failure(
        input.workspace,
        current.lifecycle,
        "wrong-project",
        "Draft belongs to another project.",
        current,
      );
    }

    const track = input.workspace.tracks.find(
      (item) => item.id === current.event.trackId,
    );
    if (track?.locked) {
      this.preventedActivationCount += 1;
      return this.failure(
        input.workspace,
        current.lifecycle,
        "locked-track",
        `Track ${track.id} is locked.`,
        current,
      );
    }

    const existingIndex = current.originEventId
      ? input.workspace.events.findIndex(
          (event) => event.id === current.originEventId,
        )
      : -1;
    if (current.originEventId) {
      const existing = input.workspace.events[existingIndex];
      if (!existing) {
        return this.failure(
          input.workspace,
          current.lifecycle,
          "event-not-found",
          "The event being edited no longer exists.",
          current,
        );
      }
      if (fingerprint(existing) !== current.originFingerprint) {
        this.preventedActivationCount += 1;
        return this.failure(
          input.workspace,
          current.lifecycle,
          "stale-edit",
          "The live event changed after this edit began. Start a fresh edit to avoid overwriting newer work.",
          current,
        );
      }
    } else if (
      input.workspace.events.some((event) => event.id === current.event.id)
    ) {
      this.preventedActivationCount += 1;
      return this.failure(
        input.workspace,
        current.lifecycle,
        "duplicate-event",
        `Event ${current.event.id} already exists.`,
        current,
      );
    }

    const now = this.now().toISOString();
    const event: TimelineEvent = {
      ...clone(current.event),
      status: "active",
      audit: {
        ...current.event.audit,
        updatedAt: now,
        updatedBy: input.activatedBy,
      },
    };
    const events = [...input.workspace.events];
    if (existingIndex >= 0) events[existingIndex] = event;
    else events.push(event);
    const workspace: TimelineWorkspace = {
      ...clone(input.workspace),
      events,
      statistics: statistics(events),
      history: [
        ...input.workspace.history,
        {
          id: `timeline-event-lifecycle-history-${this.transitionSequence + 1}`,
          action: current.originEventId
            ? "activate-event-edit"
            : "activate-new-event",
          timestamp: now,
          userId: input.activatedBy,
          eventIds: [event.id],
        },
      ],
    };
    const active: TimelineEventDraft = {
      ...current,
      lifecycle: "active",
      event,
      updatedAt: now,
      updatedBy: input.activatedBy,
      transitions: [
        ...current.transitions,
        this.transition(
          current.lifecycle,
          "active",
          input.activatedBy,
          "Validated event entered the live workspace.",
          now,
        ),
      ],
    };
    this.drafts.set(input.draftId, active);
    return {
      accepted: true,
      lifecycle: "active",
      draft: clone(active),
      workspace,
      issues: [],
    };
  }

  getDraft(draftId: TimelineId): TimelineEventDraft | null {
    const draft = this.drafts.get(draftId);
    return draft ? clone(draft) : null;
  }

  exportDrafts(): TimelineEventDraft[] {
    return Array.from(this.drafts.values()).map(clone);
  }

  restoreDrafts(drafts: TimelineEventDraft[]): void {
    this.drafts.clear();
    for (const draft of drafts) {
      this.drafts.set(draft.id, clone(draft));
      const sequence = Number(draft.id.match(/(\d+)$/)?.[1] ?? 0);
      this.draftSequence = Math.max(this.draftSequence, sequence);
      for (const transition of draft.transitions) {
        const transitionSequence = Number(
          transition.id.match(/(\d+)$/)?.[1] ?? 0,
        );
        this.transitionSequence = Math.max(
          this.transitionSequence,
          transitionSequence,
        );
      }
      for (const attempt of draft.validationAttempts) {
        const attemptSequence = Number(attempt.id.match(/(\d+)$/)?.[1] ?? 0);
        this.attemptSequence = Math.max(this.attemptSequence, attemptSequence);
      }
    }
  }

  removeDraft(draftId: TimelineId): boolean {
    return this.drafts.delete(draftId);
  }

  getHoldingSnapshot(projectId?: TimelineId): TimelineEventHoldingSnapshot {
    const drafts = Array.from(this.drafts.values())
      .filter((draft) => !projectId || draft.projectId === projectId)
      .filter((draft) => draft.lifecycle !== "active")
      .map(clone);
    return {
      generatedAt: this.now().toISOString(),
      drafts,
      heldCount: drafts.length,
      validationAttemptCount: drafts.reduce(
        (total, draft) => total + draft.validationAttempts.length,
        0,
      ),
      preventedActivationCount: this.preventedActivationCount,
    };
  }

  private transition(
    from: TimelineLifecycleState | null,
    to: TimelineLifecycleState,
    by: TimelineUserId,
    reason: string,
    at: string,
  ): TimelineEventLifecycleTransition {
    return {
      id: `timeline-event-transition-${++this.transitionSequence}`,
      from,
      to,
      at,
      by,
      reason,
    };
  }

  private failure(
    workspace: TimelineWorkspace,
    lifecycle: TimelineLifecycleState,
    code: TimelineEventLifecycleIssue["code"],
    message: string,
    draft: TimelineEventDraft | null = null,
  ): TimelineEventLifecycleResult {
    return {
      accepted: false,
      lifecycle,
      draft: draft ? clone(draft) : null,
      workspace: clone(workspace),
      issues: [{ code, message }],
    };
  }
}

export const timelineEventLifecycleEngine = new TimelineEventLifecycleEngine();
