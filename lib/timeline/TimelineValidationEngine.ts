import type {
  TimelineAttachment,
  TimelineEngineState,
  TimelineEvent,
  TimelineId,
  TimelineLocation,
  TimelineRelationship,
  TimelineStatus,
  TimelineTrack,
  TimelineValidationIssue,
  TimelineValidationReport,
  TimelineWorkspace,
} from "./TimelineTypes";

export type TimelineValidationScope =
  | "event"
  | "track"
  | "workspace"
  | "relationship"
  | "selection"
  | "viewport"
  | "statistics"
  | "activation";

export type TimelineValidationCode =
  | "required"
  | "invalid-type"
  | "duplicate-id"
  | "invalid-number"
  | "invalid-range"
  | "invalid-date"
  | "unknown-track"
  | "unknown-event"
  | "project-mismatch"
  | "relationship-self-reference"
  | "relationship-source-mismatch"
  | "parent-cycle"
  | "missing-payload"
  | "statistics-mismatch"
  | "activation-blocked";

export type TimelineDetailedValidationIssue = TimelineValidationIssue & {
  code: TimelineValidationCode;
  scope: TimelineValidationScope;
  path: string;
  entityId?: TimelineId;
  blocking: boolean;
};

export type TimelineDetailedValidationReport = TimelineValidationReport & {
  generatedAt: string;
  errorCount: number;
  warningCount: number;
  informationCount: number;
  blockingIssueCount: number;
  detailedIssues: TimelineDetailedValidationIssue[];
};

export type TimelineLifecycleState =
  "draft" | "incomplete" | "waiting-validation" | "validated" | "active";

export type TimelineActivationDecision = {
  accepted: boolean;
  lifecycle: TimelineLifecycleState;
  event: TimelineEvent;
  report: TimelineDetailedValidationReport;
};

export type TimelineHeldEvent = {
  eventId: TimelineId;
  lifecycle: Exclude<TimelineLifecycleState, "active">;
  firstHeldAt: string;
  lastCheckedAt: string;
  attempts: number;
  blockingIssues: TimelineDetailedValidationIssue[];
  event: TimelineEvent;
};

export type TimelineValidationSnapshot = {
  generatedAt: string;
  heldEvents: TimelineHeldEvent[];
  heldCount: number;
  preventedActivationCount: number;
};

const VALID_EVENT_TYPES = new Set<TimelineEvent["type"]>([
  "prompt",
  "conversation",
  "response",
  "lyric",
  "marker",
  "measure",
  "beat",
  "tempo",
  "tempo-change",
  "time-signature",
  "key-signature",
  "key-change",
  "chord",
  "melody",
  "harmony",
  "instrument",
  "arrangement",
  "transition",
  "automation",
  "quantize",
  "waveform",
  "stem",
  "audio",
  "video",
  "image",
  "midi",
  "note",
  "comment",
  "idea",
  "task",
  "analysis",
  "relationship",
  "reference",
  "version",
  "revision",
  "decision",
  "score",
  "mix",
  "master",
  "mastering",
  "recording",
  "take",
  "publish",
  "publishing",
  "release",
  "metadata",
  "catalog",
  "copyright",
  "licensing",
  "royalties",
  "custom",
]);
const ACTIVE_STATUSES = new Set<TimelineStatus>([
  "active",
  "approved",
  "completed",
  "processing",
  "recording",
]);

const PAYLOAD_FIELDS: Partial<
  Record<TimelineEvent["type"], (keyof TimelineEvent)[]>
> = {
  prompt: ["prompt", "content"],
  response: ["response", "content"],
  conversation: ["content", "conversationId"],
  lyric: ["lyric", "content"],
  marker: ["marker", "title"],
  chord: ["chord"],
  melody: ["melody"],
  harmony: ["harmony"],
  automation: ["automation", "action"],
  analysis: ["analysis", "content"],
  comment: ["comment", "content"],
  idea: ["idea", "content"],
  task: ["task", "content"],
  audio: ["audioPath"],
  video: ["videoPath"],
  image: ["imagePath"],
  stem: ["stemPath", "stemName"],
  waveform: ["waveformPath"],
  relationship: ["targetEventId", "relationshipType"],
  reference: ["referenceId", "referenceType"],
  version: ["versionName", "versionId"],
  publish: ["destination", "publishedAt"],
  master: ["masterName"],
  note: ["note", "content"],
};

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isValidDate(value: unknown): boolean {
  return hasText(value) && !Number.isNaN(Date.parse(value));
}

function issueId(
  scope: TimelineValidationScope,
  code: TimelineValidationCode,
  path: string,
) {
  return `timeline-validation:${scope}:${code}:${path}`;
}

function createIssue(
  scope: TimelineValidationScope,
  code: TimelineValidationCode,
  path: string,
  message: string,
  options: {
    entityId?: TimelineId;
    severity?: TimelineValidationIssue["severity"];
    blocking?: boolean;
  } = {},
): TimelineDetailedValidationIssue {
  const severity = options.severity ?? "error";
  return {
    id: issueId(scope, code, path),
    severity,
    message,
    code,
    scope,
    path,
    entityId: options.entityId,
    blocking: options.blocking ?? severity === "error",
  };
}

function buildReport(
  issues: TimelineDetailedValidationIssue[],
): TimelineDetailedValidationReport {
  const errorCount = issues.filter(
    (issue) => issue.severity === "error",
  ).length;
  const warningCount = issues.filter(
    (issue) => issue.severity === "warning",
  ).length;
  const informationCount = issues.filter(
    (issue) => issue.severity === "info",
  ).length;
  const blockingIssueCount = issues.filter((issue) => issue.blocking).length;

  return {
    valid: blockingIssueCount === 0,
    issueCount: issues.length,
    issues: issues.map(({ id, severity, message }) => ({
      id,
      severity,
      message,
    })),
    generatedAt: new Date().toISOString(),
    errorCount,
    warningCount,
    informationCount,
    blockingIssueCount,
    detailedIssues: issues,
  };
}

function validateLocation(
  location: TimelineLocation | null | undefined,
  eventId: TimelineId,
): TimelineDetailedValidationIssue[] {
  if (!location) {
    return [
      createIssue(
        "event",
        "required",
        `events.${eventId}.location`,
        "Event location is required.",
        {
          entityId: eventId,
        },
      ),
    ];
  }

  const issues: TimelineDetailedValidationIssue[] = [];
  const values: Array<[keyof TimelineLocation, number, number]> = [
    ["seconds", location.seconds, 0],
    ["milliseconds", location.milliseconds, 0],
    ["bar", location.bar, 1],
    ["beat", location.beat, 1],
    ["tick", location.tick, 0],
  ];

  for (const [field, value, minimum] of values) {
    const path = `events.${eventId}.location.${field}`;
    if (!isFiniteNumber(value)) {
      issues.push(
        createIssue(
          "event",
          "invalid-number",
          path,
          `${field} must be a finite number.`,
          {
            entityId: eventId,
          },
        ),
      );
    } else if (value < minimum) {
      issues.push(
        createIssue(
          "event",
          "invalid-range",
          path,
          `${field} cannot be less than ${minimum}.`,
          {
            entityId: eventId,
          },
        ),
      );
    }
  }

  return issues;
}

function validateAttachment(
  attachment: TimelineAttachment,
  eventId: TimelineId,
  index: number,
): TimelineDetailedValidationIssue[] {
  const issues: TimelineDetailedValidationIssue[] = [];
  const base = `events.${eventId}.attachments.${index}`;
  if (!hasText(attachment.id)) {
    issues.push(
      createIssue(
        "event",
        "required",
        `${base}.id`,
        "Attachment ID is required.",
        { entityId: eventId },
      ),
    );
  }
  if (!hasText(attachment.name)) {
    issues.push(
      createIssue(
        "event",
        "required",
        `${base}.name`,
        "Attachment name is required.",
        { entityId: eventId },
      ),
    );
  }
  if (!hasText(attachment.path)) {
    issues.push(
      createIssue(
        "event",
        "required",
        `${base}.path`,
        "Attachment path is required.",
        { entityId: eventId },
      ),
    );
  }
  return issues;
}

function validateRelationship(
  relationship: TimelineRelationship,
  event: TimelineEvent,
  index: number,
  eventIds?: ReadonlySet<TimelineId>,
): TimelineDetailedValidationIssue[] {
  const issues: TimelineDetailedValidationIssue[] = [];
  const base = `events.${event.id}.relationships.${index}`;

  if (!hasText(relationship.sourceId)) {
    issues.push(
      createIssue(
        "relationship",
        "required",
        `${base}.sourceId`,
        "Relationship source ID is required.",
        { entityId: event.id },
      ),
    );
  } else if (relationship.sourceId !== event.id) {
    issues.push(
      createIssue(
        "relationship",
        "relationship-source-mismatch",
        `${base}.sourceId`,
        `Relationship source ${relationship.sourceId} does not match owning event ${event.id}.`,
        { entityId: event.id },
      ),
    );
  }

  if (!hasText(relationship.targetId)) {
    issues.push(
      createIssue(
        "relationship",
        "required",
        `${base}.targetId`,
        "Relationship target ID is required.",
        { entityId: event.id },
      ),
    );
  } else {
    if (relationship.targetId === event.id) {
      issues.push(
        createIssue(
          "relationship",
          "relationship-self-reference",
          `${base}.targetId`,
          "An event cannot relate to itself.",
          { entityId: event.id },
        ),
      );
    }
    if (eventIds && !eventIds.has(relationship.targetId)) {
      issues.push(
        createIssue(
          "relationship",
          "unknown-event",
          `${base}.targetId`,
          `Relationship target ${relationship.targetId} does not exist.`,
          { entityId: event.id },
        ),
      );
    }
  }

  if (!hasText(relationship.relationship) && !hasText(relationship.type)) {
    issues.push(
      createIssue(
        "relationship",
        "required",
        `${base}.type`,
        "Relationship type or relationship label is required.",
        { entityId: event.id },
      ),
    );
  }

  return issues;
}

function hasTypePayload(event: TimelineEvent): boolean {
  const fields = PAYLOAD_FIELDS[event.type];
  if (!fields || fields.length === 0) return true;
  return fields.some((field) => {
    const value = event[field];
    return hasText(value) || (Array.isArray(value) && value.length > 0);
  });
}

export class TimelineValidationEngine {
  private readonly heldEvents = new Map<TimelineId, TimelineHeldEvent>();
  private preventedActivationCount = 0;

  validateTrack(
    track: TimelineTrack,
    index = 0,
  ): TimelineDetailedValidationReport {
    const issues: TimelineDetailedValidationIssue[] = [];
    const entityId = track.id || `track-${index}`;
    const base = `tracks.${entityId}`;

    if (!hasText(track.id)) {
      issues.push(
        createIssue(
          "track",
          "required",
          `${base}.id`,
          "Track ID is required.",
          { entityId },
        ),
      );
    }
    if (!hasText(track.title)) {
      issues.push(
        createIssue(
          "track",
          "required",
          `${base}.title`,
          "Track title is required.",
          { entityId },
        ),
      );
    }
    if (!hasText(track.color)) {
      issues.push(
        createIssue(
          "track",
          "required",
          `${base}.color`,
          "Track color is required.",
          { entityId },
        ),
      );
    }
    if (!isFiniteNumber(track.height) || track.height <= 0) {
      issues.push(
        createIssue(
          "track",
          "invalid-range",
          `${base}.height`,
          "Track height must be greater than zero.",
          { entityId },
        ),
      );
    }

    return buildReport(issues);
  }

  validateEvent(
    event: TimelineEvent,
    context: {
      trackIds?: ReadonlySet<TimelineId>;
      eventIds?: ReadonlySet<TimelineId>;
      projectId?: TimelineId;
    } = {},
  ): TimelineDetailedValidationReport {
    const issues: TimelineDetailedValidationIssue[] = [];
    const eventId = event.id || "missing-id";
    const base = `events.${eventId}`;

    if (!VALID_EVENT_TYPES.has(event.type)) {
      issues.push(
        createIssue(
          "event",
          "invalid-type",
          `${base}.type`,
          `Event type ${String(event.type) || "(missing)"} is not a recognized Timeline event type.`,
          { entityId: eventId },
        ),
      );
    }
    if (!hasText(event.id))
      issues.push(
        createIssue("event", "required", `${base}.id`, "Event ID is required."),
      );
    if (!hasText(event.trackId)) {
      issues.push(
        createIssue(
          "event",
          "required",
          `${base}.trackId`,
          "Event track ID is required.",
          { entityId: eventId },
        ),
      );
    } else if (context.trackIds && !context.trackIds.has(event.trackId)) {
      issues.push(
        createIssue(
          "event",
          "unknown-track",
          `${base}.trackId`,
          `Track ${event.trackId} does not exist.`,
          {
            entityId: eventId,
          },
        ),
      );
    }
    if (
      context.projectId &&
      event.projectId &&
      event.projectId !== context.projectId
    ) {
      issues.push(
        createIssue(
          "event",
          "project-mismatch",
          `${base}.projectId`,
          `Event project ${event.projectId} does not match workspace project ${context.projectId}.`,
          { entityId: eventId },
        ),
      );
    }
    if (!hasText(event.title)) {
      issues.push(
        createIssue(
          "event",
          "required",
          `${base}.title`,
          "Event title is required.",
          { entityId: eventId },
        ),
      );
    }
    if (
      !event.metadata ||
      !hasText(event.metadata.title) ||
      !hasText(event.metadata.category)
    ) {
      issues.push(
        createIssue(
          "event",
          "required",
          `${base}.metadata`,
          "Event metadata requires a title and category.",
          {
            entityId: eventId,
          },
        ),
      );
    }
    if (
      !event.audit ||
      !isValidDate(event.audit.createdAt) ||
      !isValidDate(event.audit.updatedAt)
    ) {
      issues.push(
        createIssue(
          "event",
          "invalid-date",
          `${base}.audit`,
          "Event audit requires valid created and updated dates.",
          {
            entityId: eventId,
          },
        ),
      );
    } else if (
      !hasText(event.audit.createdBy) ||
      !hasText(event.audit.updatedBy)
    ) {
      issues.push(
        createIssue(
          "event",
          "required",
          `${base}.audit.user`,
          "Event audit requires creator and updater IDs.",
          {
            entityId: eventId,
          },
        ),
      );
    }

    issues.push(...validateLocation(event.location, eventId));
    event.attachments.forEach((attachment, index) =>
      issues.push(...validateAttachment(attachment, eventId, index)),
    );
    event.relationships.forEach((relationship, index) =>
      issues.push(
        ...validateRelationship(relationship, event, index, context.eventIds),
      ),
    );

    if (
      ACTIVE_STATUSES.has(event.status) &&
      (VALID_EVENT_TYPES.has(event.type)
        ? !hasTypePayload(event)
        : !hasText(event.content))
    ) {
      issues.push(
        createIssue(
          "activation",
          "missing-payload",
          `${base}.${event.type}`,
          `Active ${event.type} events require usable ${event.type} content.`,
          { entityId: eventId },
        ),
      );
    }
    if (
      event.startTime !== undefined &&
      event.endTime !== undefined &&
      event.endTime < event.startTime
    ) {
      issues.push(
        createIssue(
          "event",
          "invalid-range",
          `${base}.endTime`,
          "Event end time cannot precede start time.",
          {
            entityId: eventId,
          },
        ),
      );
    }
    for (const field of ["confidence", "energy", "valence"] as const) {
      const value = event[field];
      if (
        value !== undefined &&
        (!isFiniteNumber(value) || value < 0 || value > 1)
      ) {
        issues.push(
          createIssue(
            "event",
            "invalid-range",
            `${base}.${field}`,
            `${field} must be between 0 and 1.`,
            {
              entityId: eventId,
            },
          ),
        );
      }
    }

    return buildReport(issues);
  }

  validateWorkspace(
    workspace: TimelineWorkspace,
  ): TimelineDetailedValidationReport {
    const issues: TimelineDetailedValidationIssue[] = [];
    if (!hasText(workspace.projectId)) {
      issues.push(
        createIssue(
          "workspace",
          "required",
          "workspace.projectId",
          "Workspace project ID is required.",
        ),
      );
    }

    const trackIds = new Set<TimelineId>();
    workspace.tracks.forEach((track, index) => {
      const report = this.validateTrack(track, index);
      issues.push(...report.detailedIssues);
      if (trackIds.has(track.id)) {
        issues.push(
          createIssue(
            "track",
            "duplicate-id",
            `tracks.${track.id}`,
            `Duplicate track ID ${track.id}.`,
            {
              entityId: track.id,
            },
          ),
        );
      }
      trackIds.add(track.id);
    });

    const eventIds = new Set<TimelineId>();
    workspace.events.forEach((event) => {
      if (eventIds.has(event.id)) {
        issues.push(
          createIssue(
            "event",
            "duplicate-id",
            `events.${event.id}`,
            `Duplicate event ID ${event.id}.`,
            {
              entityId: event.id,
            },
          ),
        );
      }
      eventIds.add(event.id);
    });
    workspace.events.forEach((event) => {
      issues.push(
        ...this.validateEvent(event, {
          trackIds,
          eventIds,
          projectId: workspace.projectId,
        }).detailedIssues,
      );
    });

    for (const selectedId of workspace.selection.selectedEventIds) {
      if (!eventIds.has(selectedId)) {
        issues.push(
          createIssue(
            "selection",
            "unknown-event",
            `selection.${selectedId}`,
            `Selected event ${selectedId} does not exist.`,
          ),
        );
      }
    }

    if (
      !isFiniteNumber(workspace.viewport.zoom) ||
      workspace.viewport.zoom <= 0 ||
      workspace.viewport.visibleEnd < workspace.viewport.visibleStart
    ) {
      issues.push(
        createIssue(
          "viewport",
          "invalid-range",
          "workspace.viewport",
          "Viewport requires positive zoom and an end at or after its start.",
        ),
      );
    }

    if (workspace.statistics.totalEvents !== workspace.events.length) {
      issues.push(
        createIssue(
          "statistics",
          "statistics-mismatch",
          "workspace.statistics.totalEvents",
          `Statistics report ${workspace.statistics.totalEvents} events, but ${workspace.events.length} are loaded.`,
          { severity: "warning", blocking: false },
        ),
      );
    }

    return buildReport(issues);
  }

  validateState(state: TimelineEngineState): TimelineDetailedValidationReport {
    const workspaceReport = this.validateWorkspace(state.workspace);
    return buildReport([...workspaceReport.detailedIssues]);
  }

  evaluateActivation(
    event: TimelineEvent,
    workspace: TimelineWorkspace,
  ): TimelineActivationDecision {
    const trackIds = new Set(workspace.tracks.map((track) => track.id));
    const eventIds = new Set(workspace.events.map((item) => item.id));
    eventIds.add(event.id);
    const report = this.validateEvent(event, {
      trackIds,
      eventIds,
      projectId: workspace.projectId,
    });

    if (report.valid) {
      this.heldEvents.delete(event.id);
      return { accepted: true, lifecycle: "active", event, report };
    }

    const now = new Date().toISOString();
    const previous = this.heldEvents.get(event.id);
    const lifecycle: TimelineHeldEvent["lifecycle"] = hasText(event.id)
      ? report.blockingIssueCount > 0
        ? "incomplete"
        : "waiting-validation"
      : "draft";
    this.heldEvents.set(event.id, {
      eventId: event.id || `draft-${this.heldEvents.size + 1}`,
      lifecycle,
      firstHeldAt: previous?.firstHeldAt ?? now,
      lastCheckedAt: now,
      attempts: (previous?.attempts ?? 0) + 1,
      blockingIssues: report.detailedIssues.filter((issue) => issue.blocking),
      event,
    });
    this.preventedActivationCount += 1;

    return { accepted: false, lifecycle, event, report };
  }

  getHeldEvent(eventId: TimelineId): TimelineHeldEvent | null {
    return this.heldEvents.get(eventId) ?? null;
  }

  getSnapshot(): TimelineValidationSnapshot {
    const heldEvents = Array.from(this.heldEvents.values()).map((entry) => ({
      ...entry,
      blockingIssues: [...entry.blockingIssues],
    }));
    return {
      generatedAt: new Date().toISOString(),
      heldEvents,
      heldCount: heldEvents.length,
      preventedActivationCount: this.preventedActivationCount,
    };
  }

  clearHeldEvent(eventId: TimelineId): boolean {
    return this.heldEvents.delete(eventId);
  }

  reset(): void {
    this.heldEvents.clear();
    this.preventedActivationCount = 0;
  }
}

export const timelineValidationEngine = new TimelineValidationEngine();
