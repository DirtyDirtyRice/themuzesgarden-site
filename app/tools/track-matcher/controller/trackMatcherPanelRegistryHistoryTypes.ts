import type {
  TrackMatcherPanelRegistryCapability,
  TrackMatcherPanelRegistryId,
  TrackMatcherPanelRegistryZone,
} from "./trackMatcherPanelRegistryTypes";
import type {
  TrackMatcherPanelRegistryDiffEntry,
  TrackMatcherPanelRegistryDiffKind,
  TrackMatcherPanelRegistryDiffResult,
  TrackMatcherPanelRegistryDiffSeverity,
  TrackMatcherPanelRegistryDiffSnapshotLike,
  TrackMatcherPanelRegistryDiffSummary,
} from "./trackMatcherPanelRegistryDiffTypes";

export type TrackMatcherPanelRegistryHistoryEventKind =
  | "timeline-created"
  | "snapshot-recorded"
  | "diff-recorded"
  | "panel-added"
  | "panel-removed"
  | "panel-changed"
  | "capability-added"
  | "capability-removed"
  | "visibility-changed"
  | "plugin-slot-changed"
  | "restore-point-created"
  | "rollback-candidate-created"
  | "timeline-pruned"
  | "timeline-merged"
  | "migration-recorded"
  | "audit-note-recorded";

export type TrackMatcherPanelRegistryHistoryEventSource =
  | "snapshot"
  | "diff"
  | "restore"
  | "migration"
  | "audit"
  | "system"
  | "user";

export type TrackMatcherPanelRegistryHistoryEventLevel =
  | "info"
  | "warning"
  | "error";

export type TrackMatcherPanelRegistryHistoryRestoreStatus =
  | "candidate"
  | "recommended"
  | "blocked"
  | "applied"
  | "stale";

export type TrackMatcherPanelRegistryHistoryRetentionMode =
  | "keep-all"
  | "keep-latest"
  | "keep-latest-per-panel"
  | "keep-latest-per-snapshot"
  | "keep-window";

export type TrackMatcherPanelRegistryHistoryEvent = {
  eventId: string;
  eventKind: TrackMatcherPanelRegistryHistoryEventKind;
  eventLevel: TrackMatcherPanelRegistryHistoryEventLevel;
  eventSource: TrackMatcherPanelRegistryHistoryEventSource;
  createdAtIso: string;
  snapshotId: string;
  beforeSnapshotId?: string;
  afterSnapshotId?: string;
  panelId?: TrackMatcherPanelRegistryId;
  zone?: TrackMatcherPanelRegistryZone;
  capability?: TrackMatcherPanelRegistryCapability;
  diffKind?: TrackMatcherPanelRegistryDiffKind;
  diffSeverity?: TrackMatcherPanelRegistryDiffSeverity;
  title: string;
  message: string;
  tags: string[];
};

export type TrackMatcherPanelRegistryHistorySnapshotLineageNode = {
  snapshotId: string;
  parentSnapshotId: string | null;
  childSnapshotIds: string[];
  createdAtIso: string;
  label: string;
  totalPanels: number;
};

export type TrackMatcherPanelRegistryHistoryRestorePoint = {
  restorePointId: string;
  snapshotId: string;
  createdAtIso: string;
  label: string;
  status: TrackMatcherPanelRegistryHistoryRestoreStatus;
  reason: string;
  blockingMessages: string[];
};

export type TrackMatcherPanelRegistryHistoryRollbackCandidate = {
  rollbackId: string;
  fromSnapshotId: string;
  toSnapshotId: string;
  createdAtIso: string;
  status: TrackMatcherPanelRegistryHistoryRestoreStatus;
  severity: TrackMatcherPanelRegistryDiffSeverity;
  changeCount: number;
  reason: string;
};

export type TrackMatcherPanelRegistryHistoryAuditRecord = {
  auditId: string;
  createdAtIso: string;
  level: TrackMatcherPanelRegistryHistoryEventLevel;
  title: string;
  message: string;
  relatedSnapshotIds: string[];
  relatedPanelIds: TrackMatcherPanelRegistryId[];
};

export type TrackMatcherPanelRegistryHistoryMigrationRecord = {
  migrationId: string;
  createdAtIso: string;
  fromVersion: number;
  toVersion: number;
  title: string;
  message: string;
  affectedSnapshotIds: string[];
};

export type TrackMatcherPanelRegistryHistoryRetentionPolicy = {
  mode: TrackMatcherPanelRegistryHistoryRetentionMode;
  maxEvents: number;
  maxSnapshots: number;
  keepRestorePoints: boolean;
  keepErrorEvents: boolean;
};

export type TrackMatcherPanelRegistryHistoryTimeline = {
  timelineId: string;
  version: 1;
  createdAtIso: string;
  updatedAtIso: string;
  label: string;
  events: TrackMatcherPanelRegistryHistoryEvent[];
  lineage: TrackMatcherPanelRegistryHistorySnapshotLineageNode[];
  restorePoints: TrackMatcherPanelRegistryHistoryRestorePoint[];
  rollbackCandidates: TrackMatcherPanelRegistryHistoryRollbackCandidate[];
  auditRecords: TrackMatcherPanelRegistryHistoryAuditRecord[];
  migrationRecords: TrackMatcherPanelRegistryHistoryMigrationRecord[];
};

export type TrackMatcherPanelRegistryHistorySummary = {
  timelineId: string;
  totalEvents: number;
  totalSnapshots: number;
  totalRestorePoints: number;
  totalRollbackCandidates: number;
  totalAuditRecords: number;
  totalMigrationRecords: number;
  infoEvents: number;
  warningEvents: number;
  errorEvents: number;
  snapshotEvents: number;
  diffEvents: number;
  restoreEvents: number;
  migrationEvents: number;
  auditEvents: number;
  changedPanelIds: TrackMatcherPanelRegistryId[];
  changedZones: TrackMatcherPanelRegistryZone[];
  changedCapabilities: TrackMatcherPanelRegistryCapability[];
  firstEventIso: string | null;
  latestEventIso: string | null;
};

export type TrackMatcherPanelRegistryHistorySearchQuery = {
  text?: string;
  panelId?: TrackMatcherPanelRegistryId;
  zone?: TrackMatcherPanelRegistryZone;
  capability?: TrackMatcherPanelRegistryCapability;
  eventKind?: TrackMatcherPanelRegistryHistoryEventKind;
  eventLevel?: TrackMatcherPanelRegistryHistoryEventLevel;
  eventSource?: TrackMatcherPanelRegistryHistoryEventSource;
  snapshotId?: string;
  fromIso?: string;
  toIso?: string;
  tags?: string[];
};

export type TrackMatcherPanelRegistryHistoryGroupedEvents = {
  groupId: string;
  label: string;
  events: TrackMatcherPanelRegistryHistoryEvent[];
};

export type TrackMatcherPanelRegistryHistoryStorageEnvelope = {
  version: 1;
  savedAtIso: string;
  timeline: TrackMatcherPanelRegistryHistoryTimeline;
};

export type TrackMatcherPanelRegistryHistoryDiagnostic = {
  level: "ok" | "warning" | "error";
  title: string;
  message: string;
};

export type TrackMatcherPanelRegistryHistoryDiffImportOptions = {
  includeInfoChanges: boolean;
  includeWarningChanges: boolean;
  includeBreakingChanges: boolean;
  createRollbackCandidates: boolean;
  createRestorePoints: boolean;
};

export type TrackMatcherPanelRegistryHistoryDiffImportResult = {
  timeline: TrackMatcherPanelRegistryHistoryTimeline;
  importedEvents: TrackMatcherPanelRegistryHistoryEvent[];
  diffSummary: TrackMatcherPanelRegistryDiffSummary;
  rollbackCandidates: TrackMatcherPanelRegistryHistoryRollbackCandidate[];
  restorePoints: TrackMatcherPanelRegistryHistoryRestorePoint[];
};

export type TrackMatcherPanelRegistryHistorySnapshotPair = {
  beforeSnapshot: TrackMatcherPanelRegistryDiffSnapshotLike;
  afterSnapshot: TrackMatcherPanelRegistryDiffSnapshotLike;
  diffResult: TrackMatcherPanelRegistryDiffResult;
};
