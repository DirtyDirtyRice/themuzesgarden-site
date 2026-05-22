import type {
  TrackMatcherPanelRegistryCapability,
  TrackMatcherPanelRegistryId,
  TrackMatcherPanelRegistryZone,
} from "./trackMatcherPanelRegistryTypes";
import {
  summarizeTrackMatcherPanelRegistryDiffResult,
} from "./trackMatcherPanelRegistryDiffHelpers";
import type {
  TrackMatcherPanelRegistryDiffEntry,
  TrackMatcherPanelRegistryDiffResult,
  TrackMatcherPanelRegistryDiffSeverity,
  TrackMatcherPanelRegistryDiffSnapshotLike,
  TrackMatcherPanelRegistryDiffSummary,
} from "./trackMatcherPanelRegistryDiffTypes";
import type {
  TrackMatcherPanelRegistryHistoryAuditRecord,
  TrackMatcherPanelRegistryHistoryDiffImportOptions,
  TrackMatcherPanelRegistryHistoryDiffImportResult,
  TrackMatcherPanelRegistryHistoryEvent,
  TrackMatcherPanelRegistryHistoryEventKind,
  TrackMatcherPanelRegistryHistoryEventLevel,
  TrackMatcherPanelRegistryHistoryEventSource,
  TrackMatcherPanelRegistryHistoryGroupedEvents,
  TrackMatcherPanelRegistryHistoryMigrationRecord,
  TrackMatcherPanelRegistryHistoryRetentionPolicy,
  TrackMatcherPanelRegistryHistoryRollbackCandidate,
  TrackMatcherPanelRegistryHistoryRestorePoint,
  TrackMatcherPanelRegistryHistorySearchQuery,
  TrackMatcherPanelRegistryHistorySnapshotLineageNode,
  TrackMatcherPanelRegistryHistoryStorageEnvelope,
  TrackMatcherPanelRegistryHistorySummary,
  TrackMatcherPanelRegistryHistoryTimeline,
} from "./trackMatcherPanelRegistryHistoryTypes";

const HISTORY_VERSION = 1;

export const TRACK_MATCHER_PANEL_REGISTRY_HISTORY_DEFAULT_RETENTION_POLICY: TrackMatcherPanelRegistryHistoryRetentionPolicy =
  {
    mode: "keep-all",
    maxEvents: 500,
    maxSnapshots: 100,
    keepRestorePoints: true,
    keepErrorEvents: true,
  };

export const TRACK_MATCHER_PANEL_REGISTRY_HISTORY_DEFAULT_IMPORT_OPTIONS: TrackMatcherPanelRegistryHistoryDiffImportOptions =
  {
    includeInfoChanges: true,
    includeWarningChanges: true,
    includeBreakingChanges: true,
    createRollbackCandidates: true,
    createRestorePoints: true,
  };

function getIsoNow() {
  return new Date().toISOString();
}

function safeText(value: string | undefined | null) {
  return (value ?? "").trim();
}

function hasText(value: string | undefined | null): value is string {
  return safeText(value).length > 0;
}

function uniqueStrings(values: readonly string[]) {
  return [...new Set(values.map(safeText).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
}

function uniquePanelIds(
  values: readonly TrackMatcherPanelRegistryId[],
): TrackMatcherPanelRegistryId[] {
  return [...new Set(values)].sort((a, b) => String(a).localeCompare(String(b)));
}

function uniqueZones(
  values: readonly TrackMatcherPanelRegistryZone[],
): TrackMatcherPanelRegistryZone[] {
  return [...new Set(values)].sort((a, b) => String(a).localeCompare(String(b)));
}

function uniqueCapabilities(
  values: readonly TrackMatcherPanelRegistryCapability[],
): TrackMatcherPanelRegistryCapability[] {
  return [...new Set(values)].sort((a, b) => String(a).localeCompare(String(b)));
}

function createStableId(prefix: string, parts: readonly string[]) {
  return `${prefix}-${parts.map((part) => safeText(part) || "none").join("-")}`;
}

function createGeneratedId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function sortEvents(events: readonly TrackMatcherPanelRegistryHistoryEvent[]) {
  return [...events].sort((a, b) => {
    if (a.createdAtIso !== b.createdAtIso) {
      return a.createdAtIso.localeCompare(b.createdAtIso);
    }

    return a.eventId.localeCompare(b.eventId);
  });
}

function sortLineage(
  lineage: readonly TrackMatcherPanelRegistryHistorySnapshotLineageNode[],
) {
  return [...lineage].sort((a, b) => {
    if (a.createdAtIso !== b.createdAtIso) {
      return a.createdAtIso.localeCompare(b.createdAtIso);
    }

    return a.snapshotId.localeCompare(b.snapshotId);
  });
}

function sortRestorePoints(
  restorePoints: readonly TrackMatcherPanelRegistryHistoryRestorePoint[],
) {
  return [...restorePoints].sort((a, b) => {
    if (a.createdAtIso !== b.createdAtIso) {
      return a.createdAtIso.localeCompare(b.createdAtIso);
    }

    return a.restorePointId.localeCompare(b.restorePointId);
  });
}

function sortRollbackCandidates(
  rollbackCandidates: readonly TrackMatcherPanelRegistryHistoryRollbackCandidate[],
) {
  return [...rollbackCandidates].sort((a, b) => {
    if (a.createdAtIso !== b.createdAtIso) {
      return a.createdAtIso.localeCompare(b.createdAtIso);
    }

    return a.rollbackId.localeCompare(b.rollbackId);
  });
}

function sortAuditRecords(
  auditRecords: readonly TrackMatcherPanelRegistryHistoryAuditRecord[],
) {
  return [...auditRecords].sort((a, b) => {
    if (a.createdAtIso !== b.createdAtIso) {
      return a.createdAtIso.localeCompare(b.createdAtIso);
    }

    return a.auditId.localeCompare(b.auditId);
  });
}

function sortMigrationRecords(
  migrationRecords: readonly TrackMatcherPanelRegistryHistoryMigrationRecord[],
) {
  return [...migrationRecords].sort((a, b) => {
    if (a.createdAtIso !== b.createdAtIso) {
      return a.createdAtIso.localeCompare(b.createdAtIso);
    }

    return a.migrationId.localeCompare(b.migrationId);
  });
}

function normalizeTimeline(
  timeline: TrackMatcherPanelRegistryHistoryTimeline,
): TrackMatcherPanelRegistryHistoryTimeline {
  return {
    ...timeline,
    version: HISTORY_VERSION,
    events: sortEvents(timeline.events),
    lineage: sortLineage(timeline.lineage),
    restorePoints: sortRestorePoints(timeline.restorePoints),
    rollbackCandidates: sortRollbackCandidates(timeline.rollbackCandidates),
    auditRecords: sortAuditRecords(timeline.auditRecords),
    migrationRecords: sortMigrationRecords(timeline.migrationRecords),
  };
}

function getEventLevelFromDiffSeverity(
  severity: TrackMatcherPanelRegistryDiffSeverity,
): TrackMatcherPanelRegistryHistoryEventLevel {
  if (severity === "breaking") return "error";
  if (severity === "warning") return "warning";
  return "info";
}

function getEventKindFromDiffEntry(
  entry: TrackMatcherPanelRegistryDiffEntry,
): TrackMatcherPanelRegistryHistoryEventKind {
  if (entry.kind === "panel-added") return "panel-added";
  if (entry.kind === "panel-removed") return "panel-removed";
  if (entry.kind === "capability-added") return "capability-added";
  if (entry.kind === "capability-removed") return "capability-removed";
  if (entry.kind === "visibility-changed") return "visibility-changed";
  if (entry.kind === "plugin-slot-changed") return "plugin-slot-changed";
  return "panel-changed";
}

function shouldImportDiffEntry(
  entry: TrackMatcherPanelRegistryDiffEntry,
  options: TrackMatcherPanelRegistryHistoryDiffImportOptions,
) {
  if (entry.severity === "info") return options.includeInfoChanges;
  if (entry.severity === "warning") return options.includeWarningChanges;
  return options.includeBreakingChanges;
}

function getCapabilityFromDiffEntry(
  entry: TrackMatcherPanelRegistryDiffEntry,
): TrackMatcherPanelRegistryCapability | undefined {
  if (entry.kind !== "capability-added" && entry.kind !== "capability-removed") {
    return undefined;
  }

  if (Array.isArray(entry.after)) {
    const after = entry.after.filter((value): value is string => typeof value === "string");
    const before = Array.isArray(entry.before)
      ? entry.before.filter((value): value is string => typeof value === "string")
      : [];
    const added = after.find((value) => !before.includes(value));
    if (added) return added as TrackMatcherPanelRegistryCapability;
  }

  if (Array.isArray(entry.before)) {
    const before = entry.before.filter((value): value is string => typeof value === "string");
    const after = Array.isArray(entry.after)
      ? entry.after.filter((value): value is string => typeof value === "string")
      : [];
    const removed = before.find((value) => !after.includes(value));
    if (removed) return removed as TrackMatcherPanelRegistryCapability;
  }

  return undefined;
}

function findPanelZone(
  snapshot: TrackMatcherPanelRegistryDiffSnapshotLike,
  panelId: TrackMatcherPanelRegistryId,
): TrackMatcherPanelRegistryZone | undefined {
  return snapshot.panels.find((panel) => panel.id === panelId)?.zone;
}

export function createTrackMatcherPanelRegistryHistoryTimeline(
  label = "Track Matcher panel registry history",
): TrackMatcherPanelRegistryHistoryTimeline {
  const createdAtIso = getIsoNow();

  return {
    timelineId: createGeneratedId("track-matcher-panel-registry-history"),
    version: HISTORY_VERSION,
    createdAtIso,
    updatedAtIso: createdAtIso,
    label,
    events: [],
    lineage: [],
    restorePoints: [],
    rollbackCandidates: [],
    auditRecords: [],
    migrationRecords: [],
  };
}

export function createTrackMatcherPanelRegistryHistoryEvent(options: {
  eventKind: TrackMatcherPanelRegistryHistoryEventKind;
  eventLevel?: TrackMatcherPanelRegistryHistoryEventLevel;
  eventSource?: TrackMatcherPanelRegistryHistoryEventSource;
  snapshotId: string;
  beforeSnapshotId?: string;
  afterSnapshotId?: string;
  panelId?: TrackMatcherPanelRegistryId;
  zone?: TrackMatcherPanelRegistryZone;
  capability?: TrackMatcherPanelRegistryCapability;
  diffKind?: TrackMatcherPanelRegistryDiffEntry["kind"];
  diffSeverity?: TrackMatcherPanelRegistryDiffSeverity;
  title: string;
  message: string;
  tags?: readonly string[];
  createdAtIso?: string;
}): TrackMatcherPanelRegistryHistoryEvent {
  const createdAtIso = options.createdAtIso ?? getIsoNow();

  return {
    eventId: createGeneratedId("history-event"),
    eventKind: options.eventKind,
    eventLevel: options.eventLevel ?? "info",
    eventSource: options.eventSource ?? "system",
    createdAtIso,
    snapshotId: options.snapshotId,
    beforeSnapshotId: options.beforeSnapshotId,
    afterSnapshotId: options.afterSnapshotId,
    panelId: options.panelId,
    zone: options.zone,
    capability: options.capability,
    diffKind: options.diffKind,
    diffSeverity: options.diffSeverity,
    title: options.title,
    message: options.message,
    tags: uniqueStrings(options.tags ?? []),
  };
}

export function appendTrackMatcherPanelRegistryHistoryEvent(
  timeline: TrackMatcherPanelRegistryHistoryTimeline,
  event: TrackMatcherPanelRegistryHistoryEvent,
): TrackMatcherPanelRegistryHistoryTimeline {
  return normalizeTimeline({
    ...timeline,
    updatedAtIso: getIsoNow(),
    events: [...timeline.events, event],
  });
}

export function appendTrackMatcherPanelRegistryHistoryEvents(
  timeline: TrackMatcherPanelRegistryHistoryTimeline,
  events: readonly TrackMatcherPanelRegistryHistoryEvent[],
): TrackMatcherPanelRegistryHistoryTimeline {
  return normalizeTimeline({
    ...timeline,
    updatedAtIso: getIsoNow(),
    events: [...timeline.events, ...events],
  });
}

export function createTrackMatcherPanelRegistryHistoryLineageNode(
  snapshot: TrackMatcherPanelRegistryDiffSnapshotLike,
  parentSnapshotId: string | null = null,
): TrackMatcherPanelRegistryHistorySnapshotLineageNode {
  return {
    snapshotId: snapshot.snapshotId,
    parentSnapshotId,
    childSnapshotIds: [],
    createdAtIso: snapshot.createdAtIso,
    label: snapshot.label,
    totalPanels: snapshot.panels.length,
  };
}

export function addTrackMatcherPanelRegistryHistoryLineageNode(
  timeline: TrackMatcherPanelRegistryHistoryTimeline,
  node: TrackMatcherPanelRegistryHistorySnapshotLineageNode,
): TrackMatcherPanelRegistryHistoryTimeline {
  const lineageById = new Map<string, TrackMatcherPanelRegistryHistorySnapshotLineageNode>();

  for (const existingNode of timeline.lineage) {
    lineageById.set(existingNode.snapshotId, { ...existingNode });
  }

  const previousNode = lineageById.get(node.snapshotId);
  lineageById.set(node.snapshotId, {
    ...node,
    childSnapshotIds: uniqueStrings([
      ...(previousNode?.childSnapshotIds ?? []),
      ...node.childSnapshotIds,
    ]),
  });

  if (node.parentSnapshotId) {
    const parentNode = lineageById.get(node.parentSnapshotId);

    if (parentNode) {
      lineageById.set(parentNode.snapshotId, {
        ...parentNode,
        childSnapshotIds: uniqueStrings([
          ...parentNode.childSnapshotIds,
          node.snapshotId,
        ]),
      });
    }
  }

  return normalizeTimeline({
    ...timeline,
    updatedAtIso: getIsoNow(),
    lineage: [...lineageById.values()],
  });
}

export function recordTrackMatcherPanelRegistryHistorySnapshot(
  timeline: TrackMatcherPanelRegistryHistoryTimeline,
  snapshot: TrackMatcherPanelRegistryDiffSnapshotLike,
  parentSnapshotId: string | null = null,
): TrackMatcherPanelRegistryHistoryTimeline {
  const withLineage = addTrackMatcherPanelRegistryHistoryLineageNode(
    timeline,
    createTrackMatcherPanelRegistryHistoryLineageNode(snapshot, parentSnapshotId),
  );
  const event = createTrackMatcherPanelRegistryHistoryEvent({
    eventKind: "snapshot-recorded",
    eventLevel: "info",
    eventSource: "snapshot",
    snapshotId: snapshot.snapshotId,
    title: "Registry snapshot recorded",
    message: `Recorded registry snapshot ${snapshot.snapshotId} with ${snapshot.panels.length} panels.`,
    tags: ["snapshot", "registry"],
  });

  return appendTrackMatcherPanelRegistryHistoryEvent(withLineage, event);
}

export function createTrackMatcherPanelRegistryHistoryEventFromDiffEntry(
  entry: TrackMatcherPanelRegistryDiffEntry,
  diffResult: TrackMatcherPanelRegistryDiffResult,
  afterSnapshot: TrackMatcherPanelRegistryDiffSnapshotLike,
): TrackMatcherPanelRegistryHistoryEvent {
  return createTrackMatcherPanelRegistryHistoryEvent({
    eventKind: getEventKindFromDiffEntry(entry),
    eventLevel: getEventLevelFromDiffSeverity(entry.severity),
    eventSource: "diff",
    snapshotId: diffResult.afterSnapshotId,
    beforeSnapshotId: diffResult.beforeSnapshotId,
    afterSnapshotId: diffResult.afterSnapshotId,
    panelId: entry.panelId,
    zone: findPanelZone(afterSnapshot, entry.panelId),
    capability: getCapabilityFromDiffEntry(entry),
    diffKind: entry.kind,
    diffSeverity: entry.severity,
    title: entry.kind,
    message: entry.message,
    tags: ["diff", entry.kind, entry.severity, entry.field],
    createdAtIso: diffResult.comparedAtIso,
  });
}

export function createTrackMatcherPanelRegistryHistoryRestorePoint(
  snapshot: TrackMatcherPanelRegistryDiffSnapshotLike,
  status: TrackMatcherPanelRegistryHistoryRestorePoint["status"] = "candidate",
  reason = "Snapshot is available as a restore point.",
): TrackMatcherPanelRegistryHistoryRestorePoint {
  return {
    restorePointId: createStableId("restore-point", [snapshot.snapshotId]),
    snapshotId: snapshot.snapshotId,
    createdAtIso: getIsoNow(),
    label: snapshot.label,
    status,
    reason,
    blockingMessages: [],
  };
}

export function createTrackMatcherPanelRegistryHistoryRollbackCandidate(
  diffResult: TrackMatcherPanelRegistryDiffResult,
  diffSummary: TrackMatcherPanelRegistryDiffSummary,
): TrackMatcherPanelRegistryHistoryRollbackCandidate {
  const severity: TrackMatcherPanelRegistryDiffSeverity =
    diffSummary.breakingChanges > 0
      ? "breaking"
      : diffSummary.warningChanges > 0
        ? "warning"
        : "info";

  return {
    rollbackId: createStableId("rollback-candidate", [
      diffResult.afterSnapshotId,
      diffResult.beforeSnapshotId,
    ]),
    fromSnapshotId: diffResult.afterSnapshotId,
    toSnapshotId: diffResult.beforeSnapshotId,
    createdAtIso: getIsoNow(),
    status: severity === "breaking" ? "recommended" : "candidate",
    severity,
    changeCount: diffSummary.totalChanges,
    reason:
      severity === "breaking"
        ? "Breaking registry changes were detected."
        : "Registry changes were detected and can be rolled back if needed.",
  };
}

export function importTrackMatcherPanelRegistryDiffIntoHistory(
  timeline: TrackMatcherPanelRegistryHistoryTimeline,
  beforeSnapshot: TrackMatcherPanelRegistryDiffSnapshotLike,
  afterSnapshot: TrackMatcherPanelRegistryDiffSnapshotLike,
  diffResult: TrackMatcherPanelRegistryDiffResult,
  options: TrackMatcherPanelRegistryHistoryDiffImportOptions =
    TRACK_MATCHER_PANEL_REGISTRY_HISTORY_DEFAULT_IMPORT_OPTIONS,
): TrackMatcherPanelRegistryHistoryDiffImportResult {
  const diffSummary = summarizeTrackMatcherPanelRegistryDiffResult(diffResult);
  const importedEvents = diffResult.entries
    .filter((entry) => shouldImportDiffEntry(entry, options))
    .map((entry) =>
      createTrackMatcherPanelRegistryHistoryEventFromDiffEntry(
        entry,
        diffResult,
        afterSnapshot,
      ),
    );
  const diffRecordedEvent = createTrackMatcherPanelRegistryHistoryEvent({
    eventKind: "diff-recorded",
    eventLevel:
      diffSummary.breakingChanges > 0
        ? "error"
        : diffSummary.warningChanges > 0
          ? "warning"
          : "info",
    eventSource: "diff",
    snapshotId: diffResult.afterSnapshotId,
    beforeSnapshotId: diffResult.beforeSnapshotId,
    afterSnapshotId: diffResult.afterSnapshotId,
    title: "Registry diff recorded",
    message: `Recorded ${diffSummary.totalChanges} registry diff change(s).`,
    tags: ["diff", "summary"],
    createdAtIso: diffResult.comparedAtIso,
  });
  const restorePoints = options.createRestorePoints
    ? [
        createTrackMatcherPanelRegistryHistoryRestorePoint(beforeSnapshot),
        createTrackMatcherPanelRegistryHistoryRestorePoint(afterSnapshot),
      ]
    : [];
  const rollbackCandidates = options.createRollbackCandidates
    ? [createTrackMatcherPanelRegistryHistoryRollbackCandidate(diffResult, diffSummary)]
    : [];
  const withBeforeSnapshot = recordTrackMatcherPanelRegistryHistorySnapshot(
    timeline,
    beforeSnapshot,
    null,
  );
  const withAfterSnapshot = recordTrackMatcherPanelRegistryHistorySnapshot(
    withBeforeSnapshot,
    afterSnapshot,
    beforeSnapshot.snapshotId,
  );
  const nextTimeline = normalizeTimeline({
    ...withAfterSnapshot,
    updatedAtIso: getIsoNow(),
    events: [...withAfterSnapshot.events, diffRecordedEvent, ...importedEvents],
    restorePoints: [...withAfterSnapshot.restorePoints, ...restorePoints],
    rollbackCandidates: [
      ...withAfterSnapshot.rollbackCandidates,
      ...rollbackCandidates,
    ],
  });

  return {
    timeline: nextTimeline,
    importedEvents,
    diffSummary,
    rollbackCandidates,
    restorePoints,
  };
}

export function summarizeTrackMatcherPanelRegistryHistoryTimeline(
  timeline: TrackMatcherPanelRegistryHistoryTimeline,
): TrackMatcherPanelRegistryHistorySummary {
  const events = timeline.events;
  const changedPanelIds = uniquePanelIds(
    events
      .map((event) => event.panelId)
      .filter((panelId): panelId is TrackMatcherPanelRegistryId => Boolean(panelId)),
  );
  const changedZones = uniqueZones(
    events
      .map((event) => event.zone)
      .filter((zone): zone is TrackMatcherPanelRegistryZone => Boolean(zone)),
  );
  const changedCapabilities = uniqueCapabilities(
    events
      .map((event) => event.capability)
      .filter(
        (capability): capability is TrackMatcherPanelRegistryCapability =>
          Boolean(capability),
      ),
  );

  return {
    timelineId: timeline.timelineId,
    totalEvents: events.length,
    totalSnapshots: timeline.lineage.length,
    totalRestorePoints: timeline.restorePoints.length,
    totalRollbackCandidates: timeline.rollbackCandidates.length,
    totalAuditRecords: timeline.auditRecords.length,
    totalMigrationRecords: timeline.migrationRecords.length,
    infoEvents: events.filter((event) => event.eventLevel === "info").length,
    warningEvents: events.filter((event) => event.eventLevel === "warning").length,
    errorEvents: events.filter((event) => event.eventLevel === "error").length,
    snapshotEvents: events.filter((event) => event.eventSource === "snapshot").length,
    diffEvents: events.filter((event) => event.eventSource === "diff").length,
    restoreEvents: events.filter((event) => event.eventSource === "restore").length,
    migrationEvents: events.filter((event) => event.eventSource === "migration").length,
    auditEvents: events.filter((event) => event.eventSource === "audit").length,
    changedPanelIds,
    changedZones,
    changedCapabilities,
    firstEventIso: events[0]?.createdAtIso ?? null,
    latestEventIso: events[events.length - 1]?.createdAtIso ?? null,
  };
}

export function searchTrackMatcherPanelRegistryHistoryEvents(
  timeline: TrackMatcherPanelRegistryHistoryTimeline,
  query: TrackMatcherPanelRegistryHistorySearchQuery,
) {
  const text = safeText(query.text).toLowerCase();
  const tagSet = new Set(query.tags ?? []);

  return timeline.events.filter((event) => {
    if (query.panelId && event.panelId !== query.panelId) return false;
    if (query.zone && event.zone !== query.zone) return false;
    if (query.capability && event.capability !== query.capability) return false;
    if (query.eventKind && event.eventKind !== query.eventKind) return false;
    if (query.eventLevel && event.eventLevel !== query.eventLevel) return false;
    if (query.eventSource && event.eventSource !== query.eventSource) return false;
    if (
      query.snapshotId &&
      event.snapshotId !== query.snapshotId &&
      event.beforeSnapshotId !== query.snapshotId &&
      event.afterSnapshotId !== query.snapshotId
    ) {
      return false;
    }
    if (query.fromIso && event.createdAtIso < query.fromIso) return false;
    if (query.toIso && event.createdAtIso > query.toIso) return false;
    if (tagSet.size > 0 && !event.tags.some((tag) => tagSet.has(tag))) return false;

    if (text) {
      const haystack = [
        event.title,
        event.message,
        event.eventKind,
        event.eventLevel,
        event.eventSource,
        event.panelId,
        event.zone,
        event.capability,
        ...event.tags,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(text)) return false;
    }

    return true;
  });
}

export function getTrackMatcherPanelRegistryHistoryEventsByPanelId(
  timeline: TrackMatcherPanelRegistryHistoryTimeline,
  panelId: TrackMatcherPanelRegistryId,
) {
  return searchTrackMatcherPanelRegistryHistoryEvents(timeline, { panelId });
}

export function getTrackMatcherPanelRegistryHistoryEventsByZone(
  timeline: TrackMatcherPanelRegistryHistoryTimeline,
  zone: TrackMatcherPanelRegistryZone,
) {
  return searchTrackMatcherPanelRegistryHistoryEvents(timeline, { zone });
}

export function getTrackMatcherPanelRegistryHistoryEventsByCapability(
  timeline: TrackMatcherPanelRegistryHistoryTimeline,
  capability: TrackMatcherPanelRegistryCapability,
) {
  return searchTrackMatcherPanelRegistryHistoryEvents(timeline, { capability });
}

export function getTrackMatcherPanelRegistryHistoryEventsBySnapshotId(
  timeline: TrackMatcherPanelRegistryHistoryTimeline,
  snapshotId: string,
) {
  return searchTrackMatcherPanelRegistryHistoryEvents(timeline, { snapshotId });
}

export function groupTrackMatcherPanelRegistryHistoryEventsByPanel(
  timeline: TrackMatcherPanelRegistryHistoryTimeline,
): TrackMatcherPanelRegistryHistoryGroupedEvents[] {
  const groups = new Map<string, TrackMatcherPanelRegistryHistoryEvent[]>();

  for (const event of timeline.events) {
    const groupId = event.panelId ?? "no-panel";
    groups.set(groupId, [...(groups.get(groupId) ?? []), event]);
  }

  return [...groups.entries()]
    .map(([groupId, events]) => ({
      groupId,
      label: groupId === "no-panel" ? "No Panel" : groupId,
      events: sortEvents(events),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function groupTrackMatcherPanelRegistryHistoryEventsBySnapshot(
  timeline: TrackMatcherPanelRegistryHistoryTimeline,
): TrackMatcherPanelRegistryHistoryGroupedEvents[] {
  const groups = new Map<string, TrackMatcherPanelRegistryHistoryEvent[]>();

  for (const event of timeline.events) {
    groups.set(event.snapshotId, [...(groups.get(event.snapshotId) ?? []), event]);
  }

  return [...groups.entries()]
    .map(([groupId, events]) => ({
      groupId,
      label: groupId,
      events: sortEvents(events),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function groupTrackMatcherPanelRegistryHistoryEventsByKind(
  timeline: TrackMatcherPanelRegistryHistoryTimeline,
): TrackMatcherPanelRegistryHistoryGroupedEvents[] {
  const groups = new Map<string, TrackMatcherPanelRegistryHistoryEvent[]>();

  for (const event of timeline.events) {
    groups.set(event.eventKind, [...(groups.get(event.eventKind) ?? []), event]);
  }

  return [...groups.entries()]
    .map(([groupId, events]) => ({
      groupId,
      label: groupId,
      events: sortEvents(events),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function getTrackMatcherPanelRegistryHistoryLineageNode(
  timeline: TrackMatcherPanelRegistryHistoryTimeline,
  snapshotId: string,
) {
  return timeline.lineage.find((node) => node.snapshotId === snapshotId) ?? null;
}

export function getTrackMatcherPanelRegistryHistoryAncestorSnapshotIds(
  timeline: TrackMatcherPanelRegistryHistoryTimeline,
  snapshotId: string,
) {
  const ancestors: string[] = [];
  const seen = new Set<string>();
  let current = getTrackMatcherPanelRegistryHistoryLineageNode(
    timeline,
    snapshotId,
  );

  while (current?.parentSnapshotId && !seen.has(current.parentSnapshotId)) {
    seen.add(current.parentSnapshotId);
    ancestors.push(current.parentSnapshotId);
    current = getTrackMatcherPanelRegistryHistoryLineageNode(
      timeline,
      current.parentSnapshotId,
    );
  }

  return ancestors;
}

export function getTrackMatcherPanelRegistryHistoryDescendantSnapshotIds(
  timeline: TrackMatcherPanelRegistryHistoryTimeline,
  snapshotId: string,
) {
  const descendants: string[] = [];
  const seen = new Set<string>();
  const queue = [
    ...(getTrackMatcherPanelRegistryHistoryLineageNode(timeline, snapshotId)
      ?.childSnapshotIds ?? []),
  ];

  while (queue.length > 0) {
    const nextSnapshotId = queue.shift();
    if (!nextSnapshotId || seen.has(nextSnapshotId)) continue;

    seen.add(nextSnapshotId);
    descendants.push(nextSnapshotId);

    const node = getTrackMatcherPanelRegistryHistoryLineageNode(
      timeline,
      nextSnapshotId,
    );

    queue.push(...(node?.childSnapshotIds ?? []));
  }

  return descendants;
}

export function createTrackMatcherPanelRegistryHistoryAuditRecord(options: {
  level?: TrackMatcherPanelRegistryHistoryEventLevel;
  title: string;
  message: string;
  relatedSnapshotIds?: readonly string[];
  relatedPanelIds?: readonly TrackMatcherPanelRegistryId[];
}): TrackMatcherPanelRegistryHistoryAuditRecord {
  return {
    auditId: createGeneratedId("history-audit"),
    createdAtIso: getIsoNow(),
    level: options.level ?? "info",
    title: options.title,
    message: options.message,
    relatedSnapshotIds: uniqueStrings(options.relatedSnapshotIds ?? []),
    relatedPanelIds: uniquePanelIds(options.relatedPanelIds ?? []),
  };
}

export function addTrackMatcherPanelRegistryHistoryAuditRecord(
  timeline: TrackMatcherPanelRegistryHistoryTimeline,
  auditRecord: TrackMatcherPanelRegistryHistoryAuditRecord,
): TrackMatcherPanelRegistryHistoryTimeline {
  const event = createTrackMatcherPanelRegistryHistoryEvent({
    eventKind: "audit-note-recorded",
    eventLevel: auditRecord.level,
    eventSource: "audit",
    snapshotId: auditRecord.relatedSnapshotIds[0] ?? "none",
    title: auditRecord.title,
    message: auditRecord.message,
    tags: ["audit"],
  });

  return normalizeTimeline({
    ...timeline,
    updatedAtIso: getIsoNow(),
    events: [...timeline.events, event],
    auditRecords: [...timeline.auditRecords, auditRecord],
  });
}

export function createTrackMatcherPanelRegistryHistoryMigrationRecord(options: {
  fromVersion: number;
  toVersion: number;
  title: string;
  message: string;
  affectedSnapshotIds?: readonly string[];
}): TrackMatcherPanelRegistryHistoryMigrationRecord {
  return {
    migrationId: createGeneratedId("history-migration"),
    createdAtIso: getIsoNow(),
    fromVersion: options.fromVersion,
    toVersion: options.toVersion,
    title: options.title,
    message: options.message,
    affectedSnapshotIds: uniqueStrings(options.affectedSnapshotIds ?? []),
  };
}

export function addTrackMatcherPanelRegistryHistoryMigrationRecord(
  timeline: TrackMatcherPanelRegistryHistoryTimeline,
  migrationRecord: TrackMatcherPanelRegistryHistoryMigrationRecord,
): TrackMatcherPanelRegistryHistoryTimeline {
  const event = createTrackMatcherPanelRegistryHistoryEvent({
    eventKind: "migration-recorded",
    eventLevel: "info",
    eventSource: "migration",
    snapshotId: migrationRecord.affectedSnapshotIds[0] ?? "none",
    title: migrationRecord.title,
    message: migrationRecord.message,
    tags: ["migration", `${migrationRecord.fromVersion}-to-${migrationRecord.toVersion}`],
  });

  return normalizeTimeline({
    ...timeline,
    updatedAtIso: getIsoNow(),
    events: [...timeline.events, event],
    migrationRecords: [...timeline.migrationRecords, migrationRecord],
  });
}

export function getTrackMatcherPanelRegistryHistoryRollbackCandidatesByStatus(
  timeline: TrackMatcherPanelRegistryHistoryTimeline,
  status: TrackMatcherPanelRegistryHistoryRollbackCandidate["status"],
) {
  return timeline.rollbackCandidates.filter((candidate) => candidate.status === status);
}

export function getTrackMatcherPanelRegistryHistoryRecommendedRollbackCandidates(
  timeline: TrackMatcherPanelRegistryHistoryTimeline,
) {
  return getTrackMatcherPanelRegistryHistoryRollbackCandidatesByStatus(
    timeline,
    "recommended",
  );
}

export function getTrackMatcherPanelRegistryHistoryRestorePointBySnapshotId(
  timeline: TrackMatcherPanelRegistryHistoryTimeline,
  snapshotId: string,
) {
  return (
    timeline.restorePoints.find(
      (restorePoint) => restorePoint.snapshotId === snapshotId,
    ) ?? null
  );
}

export function markTrackMatcherPanelRegistryHistoryRestorePointStatus(
  timeline: TrackMatcherPanelRegistryHistoryTimeline,
  restorePointId: string,
  status: TrackMatcherPanelRegistryHistoryRestorePoint["status"],
  reason: string,
): TrackMatcherPanelRegistryHistoryTimeline {
  return normalizeTimeline({
    ...timeline,
    updatedAtIso: getIsoNow(),
    restorePoints: timeline.restorePoints.map((restorePoint) =>
      restorePoint.restorePointId === restorePointId
        ? {
            ...restorePoint,
            status,
            reason,
          }
        : restorePoint,
    ),
  });
}

export function pruneTrackMatcherPanelRegistryHistoryTimeline(
  timeline: TrackMatcherPanelRegistryHistoryTimeline,
  policy: TrackMatcherPanelRegistryHistoryRetentionPolicy =
    TRACK_MATCHER_PANEL_REGISTRY_HISTORY_DEFAULT_RETENTION_POLICY,
): TrackMatcherPanelRegistryHistoryTimeline {
  if (policy.mode === "keep-all") return normalizeTimeline(timeline);

  const protectedEventIds = new Set(
    policy.keepErrorEvents
      ? timeline.events
          .filter((event) => event.eventLevel === "error")
          .map((event) => event.eventId)
      : [],
  );
  const latestEvents = [...timeline.events]
    .sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso))
    .slice(0, Math.max(policy.maxEvents, 0));
  const nextEventIds = new Set([
    ...latestEvents.map((event) => event.eventId),
    ...protectedEventIds,
  ]);
  const nextEvents = timeline.events.filter((event) =>
    nextEventIds.has(event.eventId),
  );
  const latestLineage = [...timeline.lineage]
    .sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso))
    .slice(0, Math.max(policy.maxSnapshots, 0));
  const nextLineageIds = new Set(latestLineage.map((node) => node.snapshotId));
  const nextLineage = timeline.lineage.filter((node) =>
    nextLineageIds.has(node.snapshotId),
  );

  return normalizeTimeline({
    ...timeline,
    updatedAtIso: getIsoNow(),
    events: nextEvents,
    lineage: nextLineage,
    restorePoints: policy.keepRestorePoints ? timeline.restorePoints : [],
  });
}

export function mergeTrackMatcherPanelRegistryHistoryTimelines(
  timelines: readonly TrackMatcherPanelRegistryHistoryTimeline[],
  label = "Merged Track Matcher panel registry history",
): TrackMatcherPanelRegistryHistoryTimeline {
  const merged = createTrackMatcherPanelRegistryHistoryTimeline(label);
  const eventsById = new Map<string, TrackMatcherPanelRegistryHistoryEvent>();
  const lineageById = new Map<string, TrackMatcherPanelRegistryHistorySnapshotLineageNode>();
  const restorePointsById = new Map<string, TrackMatcherPanelRegistryHistoryRestorePoint>();
  const rollbackCandidatesById = new Map<string, TrackMatcherPanelRegistryHistoryRollbackCandidate>();
  const auditRecordsById = new Map<string, TrackMatcherPanelRegistryHistoryAuditRecord>();
  const migrationRecordsById = new Map<string, TrackMatcherPanelRegistryHistoryMigrationRecord>();

  for (const timeline of timelines) {
    for (const event of timeline.events) eventsById.set(event.eventId, event);
    for (const node of timeline.lineage) lineageById.set(node.snapshotId, node);
    for (const restorePoint of timeline.restorePoints) {
      restorePointsById.set(restorePoint.restorePointId, restorePoint);
    }
    for (const rollbackCandidate of timeline.rollbackCandidates) {
      rollbackCandidatesById.set(rollbackCandidate.rollbackId, rollbackCandidate);
    }
    for (const auditRecord of timeline.auditRecords) {
      auditRecordsById.set(auditRecord.auditId, auditRecord);
    }
    for (const migrationRecord of timeline.migrationRecords) {
      migrationRecordsById.set(migrationRecord.migrationId, migrationRecord);
    }
  }

  return normalizeTimeline({
    ...merged,
    events: [...eventsById.values()],
    lineage: [...lineageById.values()],
    restorePoints: [...restorePointsById.values()],
    rollbackCandidates: [...rollbackCandidatesById.values()],
    auditRecords: [...auditRecordsById.values()],
    migrationRecords: [...migrationRecordsById.values()],
  });
}

export function createTrackMatcherPanelRegistryHistoryStorageEnvelope(
  timeline: TrackMatcherPanelRegistryHistoryTimeline,
): TrackMatcherPanelRegistryHistoryStorageEnvelope {
  return {
    version: HISTORY_VERSION,
    savedAtIso: getIsoNow(),
    timeline: normalizeTimeline(timeline),
  };
}

export function serializeTrackMatcherPanelRegistryHistoryTimeline(
  timeline: TrackMatcherPanelRegistryHistoryTimeline,
) {
  return JSON.stringify(
    createTrackMatcherPanelRegistryHistoryStorageEnvelope(timeline),
    null,
    2,
  );
}

export function parseTrackMatcherPanelRegistryHistoryTimeline(
  rawValue: string,
): TrackMatcherPanelRegistryHistoryTimeline | null {
  try {
    const parsed = JSON.parse(rawValue) as Partial<TrackMatcherPanelRegistryHistoryStorageEnvelope>;

    if (parsed.version !== HISTORY_VERSION || !parsed.timeline) {
      return null;
    }

    return normalizeTimeline({
      ...parsed.timeline,
      version: HISTORY_VERSION,
      events: parsed.timeline.events ?? [],
      lineage: parsed.timeline.lineage ?? [],
      restorePoints: parsed.timeline.restorePoints ?? [],
      rollbackCandidates: parsed.timeline.rollbackCandidates ?? [],
      auditRecords: parsed.timeline.auditRecords ?? [],
      migrationRecords: parsed.timeline.migrationRecords ?? [],
    });
  } catch {
    return null;
  }
}
