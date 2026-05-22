import type {
  TrackMatcherPanelRegistryHistoryDiagnostic,
  TrackMatcherPanelRegistryHistorySnapshotLineageNode,
  TrackMatcherPanelRegistryHistoryTimeline,
} from "./trackMatcherPanelRegistryHistoryTypes";
import {
  getTrackMatcherPanelRegistryHistoryAncestorSnapshotIds,
  summarizeTrackMatcherPanelRegistryHistoryTimeline,
} from "./trackMatcherPanelRegistryHistoryHelpers";

function createDiagnostic(
  level: TrackMatcherPanelRegistryHistoryDiagnostic["level"],
  title: string,
  message: string,
): TrackMatcherPanelRegistryHistoryDiagnostic {
  return {
    level,
    title,
    message,
  };
}

function isValidIsoDate(value: string) {
  if (!value) return false;
  return Number.isFinite(Date.parse(value));
}

function getDuplicateValues(values: readonly string[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }

  return [...duplicates].sort((a, b) => a.localeCompare(b));
}

function getLineageMap(lineage: readonly TrackMatcherPanelRegistryHistorySnapshotLineageNode[]) {
  const map = new Map<string, TrackMatcherPanelRegistryHistorySnapshotLineageNode>();

  for (const node of lineage) {
    map.set(node.snapshotId, node);
  }

  return map;
}

function hasCircularLineage(
  timeline: TrackMatcherPanelRegistryHistoryTimeline,
  snapshotId: string,
) {
  const ancestors = getTrackMatcherPanelRegistryHistoryAncestorSnapshotIds(
    timeline,
    snapshotId,
  );

  return ancestors.includes(snapshotId);
}

export function getTrackMatcherPanelRegistryHistoryTimelineDiagnostics(
  timeline: TrackMatcherPanelRegistryHistoryTimeline,
): TrackMatcherPanelRegistryHistoryDiagnostic[] {
  const diagnostics: TrackMatcherPanelRegistryHistoryDiagnostic[] = [];
  const summary = summarizeTrackMatcherPanelRegistryHistoryTimeline(timeline);
  const eventIdDuplicates = getDuplicateValues(
    timeline.events.map((event) => event.eventId),
  );
  const snapshotIdDuplicates = getDuplicateValues(
    timeline.lineage.map((node) => node.snapshotId),
  );
  const restorePointDuplicates = getDuplicateValues(
    timeline.restorePoints.map((restorePoint) => restorePoint.restorePointId),
  );
  const rollbackCandidateDuplicates = getDuplicateValues(
    timeline.rollbackCandidates.map((candidate) => candidate.rollbackId),
  );
  const auditDuplicates = getDuplicateValues(
    timeline.auditRecords.map((auditRecord) => auditRecord.auditId),
  );
  const migrationDuplicates = getDuplicateValues(
    timeline.migrationRecords.map((migrationRecord) => migrationRecord.migrationId),
  );
  const lineageMap = getLineageMap(timeline.lineage);

  if (!timeline.timelineId) {
    diagnostics.push(
      createDiagnostic(
        "error",
        "Missing timeline id",
        "The registry history timeline does not include a timelineId.",
      ),
    );
  }

  if (timeline.version !== 1) {
    diagnostics.push(
      createDiagnostic(
        "error",
        "Unsupported timeline version",
        `The registry history timeline version is ${timeline.version}; expected version 1.`,
      ),
    );
  }

  if (!timeline.label.trim()) {
    diagnostics.push(
      createDiagnostic(
        "warning",
        "Missing timeline label",
        "The registry history timeline label is empty.",
      ),
    );
  }

  if (!isValidIsoDate(timeline.createdAtIso)) {
    diagnostics.push(
      createDiagnostic(
        "warning",
        "Invalid timeline created timestamp",
        "The registry history timeline createdAtIso value is missing or invalid.",
      ),
    );
  }

  if (!isValidIsoDate(timeline.updatedAtIso)) {
    diagnostics.push(
      createDiagnostic(
        "warning",
        "Invalid timeline updated timestamp",
        "The registry history timeline updatedAtIso value is missing or invalid.",
      ),
    );
  }

  if (summary.totalEvents === 0) {
    diagnostics.push(
      createDiagnostic(
        "warning",
        "Empty registry history timeline",
        "The registry history timeline does not contain any events yet.",
      ),
    );
  }

  for (const duplicateId of eventIdDuplicates) {
    diagnostics.push(
      createDiagnostic(
        "error",
        "Duplicate history event id",
        `History event ${duplicateId} appears more than once.`,
      ),
    );
  }

  for (const duplicateId of snapshotIdDuplicates) {
    diagnostics.push(
      createDiagnostic(
        "error",
        "Duplicate lineage snapshot id",
        `Lineage snapshot ${duplicateId} appears more than once.`,
      ),
    );
  }

  for (const duplicateId of restorePointDuplicates) {
    diagnostics.push(
      createDiagnostic(
        "error",
        "Duplicate restore point id",
        `Restore point ${duplicateId} appears more than once.`,
      ),
    );
  }

  for (const duplicateId of rollbackCandidateDuplicates) {
    diagnostics.push(
      createDiagnostic(
        "error",
        "Duplicate rollback candidate id",
        `Rollback candidate ${duplicateId} appears more than once.`,
      ),
    );
  }

  for (const duplicateId of auditDuplicates) {
    diagnostics.push(
      createDiagnostic(
        "error",
        "Duplicate audit record id",
        `Audit record ${duplicateId} appears more than once.`,
      ),
    );
  }

  for (const duplicateId of migrationDuplicates) {
    diagnostics.push(
      createDiagnostic(
        "error",
        "Duplicate migration record id",
        `Migration record ${duplicateId} appears more than once.`,
      ),
    );
  }

  for (const event of timeline.events) {
    if (!event.eventId) {
      diagnostics.push(
        createDiagnostic(
          "error",
          "Missing history event id",
          "A registry history event is missing its eventId.",
        ),
      );
    }

    if (!event.snapshotId) {
      diagnostics.push(
        createDiagnostic(
          "warning",
          "History event missing snapshot id",
          `History event ${event.eventId || "unknown"} is missing its snapshotId.`,
        ),
      );
    }

    if (!event.title.trim()) {
      diagnostics.push(
        createDiagnostic(
          "warning",
          "History event missing title",
          `History event ${event.eventId || "unknown"} has an empty title.`,
        ),
      );
    }

    if (!event.message.trim()) {
      diagnostics.push(
        createDiagnostic(
          "warning",
          "History event missing message",
          `History event ${event.eventId || "unknown"} has an empty message.`,
        ),
      );
    }

    if (!isValidIsoDate(event.createdAtIso)) {
      diagnostics.push(
        createDiagnostic(
          "warning",
          "Invalid history event timestamp",
          `History event ${event.eventId || "unknown"} has an invalid createdAtIso value.`,
        ),
      );
    }
  }

  for (const node of timeline.lineage) {
    if (!node.snapshotId) {
      diagnostics.push(
        createDiagnostic(
          "error",
          "Missing lineage snapshot id",
          "A lineage node is missing its snapshotId.",
        ),
      );
    }

    if (node.parentSnapshotId && !lineageMap.has(node.parentSnapshotId)) {
      diagnostics.push(
        createDiagnostic(
          "warning",
          "Lineage parent missing",
          `Snapshot ${node.snapshotId} points to missing parent ${node.parentSnapshotId}.`,
        ),
      );
    }

    for (const childSnapshotId of node.childSnapshotIds) {
      if (!lineageMap.has(childSnapshotId)) {
        diagnostics.push(
          createDiagnostic(
            "warning",
            "Lineage child missing",
            `Snapshot ${node.snapshotId} points to missing child ${childSnapshotId}.`,
          ),
        );
      }
    }

    if (hasCircularLineage(timeline, node.snapshotId)) {
      diagnostics.push(
        createDiagnostic(
          "error",
          "Circular lineage detected",
          `Snapshot ${node.snapshotId} appears in its own ancestry chain.`,
        ),
      );
    }

    if (!isValidIsoDate(node.createdAtIso)) {
      diagnostics.push(
        createDiagnostic(
          "warning",
          "Invalid lineage timestamp",
          `Lineage node ${node.snapshotId || "unknown"} has an invalid createdAtIso value.`,
        ),
      );
    }

    if (!Number.isFinite(node.totalPanels) || node.totalPanels < 0) {
      diagnostics.push(
        createDiagnostic(
          "error",
          "Invalid lineage panel count",
          `Lineage node ${node.snapshotId || "unknown"} has an invalid totalPanels value.`,
        ),
      );
    }
  }

  for (const restorePoint of timeline.restorePoints) {
    if (!restorePoint.snapshotId) {
      diagnostics.push(
        createDiagnostic(
          "error",
          "Restore point missing snapshot id",
          `Restore point ${restorePoint.restorePointId || "unknown"} is missing its snapshotId.`,
        ),
      );
    }

    if (!lineageMap.has(restorePoint.snapshotId)) {
      diagnostics.push(
        createDiagnostic(
          "warning",
          "Restore point orphaned",
          `Restore point ${restorePoint.restorePointId} points to snapshot ${restorePoint.snapshotId}, which is not in lineage.`,
        ),
      );
    }

    if (restorePoint.status === "blocked" && restorePoint.blockingMessages.length === 0) {
      diagnostics.push(
        createDiagnostic(
          "warning",
          "Blocked restore point missing reason",
          `Restore point ${restorePoint.restorePointId} is blocked but has no blocking messages.`,
        ),
      );
    }
  }

  for (const rollbackCandidate of timeline.rollbackCandidates) {
    if (!lineageMap.has(rollbackCandidate.fromSnapshotId)) {
      diagnostics.push(
        createDiagnostic(
          "warning",
          "Rollback source missing",
          `Rollback candidate ${rollbackCandidate.rollbackId} points from missing snapshot ${rollbackCandidate.fromSnapshotId}.`,
        ),
      );
    }

    if (!lineageMap.has(rollbackCandidate.toSnapshotId)) {
      diagnostics.push(
        createDiagnostic(
          "warning",
          "Rollback target missing",
          `Rollback candidate ${rollbackCandidate.rollbackId} points to missing snapshot ${rollbackCandidate.toSnapshotId}.`,
        ),
      );
    }

    if (!Number.isFinite(rollbackCandidate.changeCount) || rollbackCandidate.changeCount < 0) {
      diagnostics.push(
        createDiagnostic(
          "error",
          "Rollback change count invalid",
          `Rollback candidate ${rollbackCandidate.rollbackId} has an invalid changeCount.`,
        ),
      );
    }
  }

  for (const auditRecord of timeline.auditRecords) {
    if (!auditRecord.title.trim()) {
      diagnostics.push(
        createDiagnostic(
          "warning",
          "Audit record missing title",
          `Audit record ${auditRecord.auditId || "unknown"} has an empty title.`,
        ),
      );
    }

    if (!auditRecord.message.trim()) {
      diagnostics.push(
        createDiagnostic(
          "warning",
          "Audit record missing message",
          `Audit record ${auditRecord.auditId || "unknown"} has an empty message.`,
        ),
      );
    }
  }

  for (const migrationRecord of timeline.migrationRecords) {
    if (migrationRecord.fromVersion === migrationRecord.toVersion) {
      diagnostics.push(
        createDiagnostic(
          "warning",
          "Migration version unchanged",
          `Migration ${migrationRecord.migrationId} has the same fromVersion and toVersion.`,
        ),
      );
    }

    if (migrationRecord.fromVersion > migrationRecord.toVersion) {
      diagnostics.push(
        createDiagnostic(
          "warning",
          "Migration version moves backward",
          `Migration ${migrationRecord.migrationId} moves from version ${migrationRecord.fromVersion} to ${migrationRecord.toVersion}.`,
        ),
      );
    }
  }

  if (diagnostics.length === 0) {
    diagnostics.push(
      createDiagnostic(
        "ok",
        "Registry history healthy",
        `Validated ${summary.totalEvents} history event(s), ${summary.totalSnapshots} snapshot lineage node(s), and ${summary.totalRestorePoints} restore point(s).`,
      ),
    );
  }

  return diagnostics;
}

export function hasTrackMatcherPanelRegistryHistoryTimelineErrors(
  timeline: TrackMatcherPanelRegistryHistoryTimeline,
) {
  return getTrackMatcherPanelRegistryHistoryTimelineDiagnostics(timeline).some(
    (diagnostic) => diagnostic.level === "error",
  );
}

export function hasTrackMatcherPanelRegistryHistoryTimelineWarnings(
  timeline: TrackMatcherPanelRegistryHistoryTimeline,
) {
  return getTrackMatcherPanelRegistryHistoryTimelineDiagnostics(timeline).some(
    (diagnostic) => diagnostic.level === "warning",
  );
}

export function getTrackMatcherPanelRegistryHistoryTimelineHealthLabel(
  timeline: TrackMatcherPanelRegistryHistoryTimeline,
) {
  const diagnostics = getTrackMatcherPanelRegistryHistoryTimelineDiagnostics(timeline);

  if (diagnostics.some((diagnostic) => diagnostic.level === "error")) {
    return "Registry history has errors";
  }

  if (diagnostics.some((diagnostic) => diagnostic.level === "warning")) {
    return "Registry history has warnings";
  }

  return "Registry history healthy";
}
