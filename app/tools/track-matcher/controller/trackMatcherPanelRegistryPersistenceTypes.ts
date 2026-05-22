import type { TrackMatcherPanelRegistryId } from "./trackMatcherPanelRegistryTypes";
import type {
  TrackMatcherPanelRegistryDiffResult,
  TrackMatcherPanelRegistryDiffSnapshotLike,
} from "./trackMatcherPanelRegistryDiffTypes";
import type {
  TrackMatcherPanelRegistryHistoryTimeline,
} from "./trackMatcherPanelRegistryHistoryTypes";

export type TrackMatcherPanelRegistryPersistenceStorageKind =
  | "local-storage"
  | "session-storage"
  | "memory"
  | "future-cloud";

export type TrackMatcherPanelRegistryPersistenceEntityKind =
  | "diff-snapshot"
  | "diff-result"
  | "history-timeline"
  | "unknown";

export type TrackMatcherPanelRegistryPersistenceRecordStatus =
  | "active"
  | "archived"
  | "corrupt"
  | "migrated";

export type TrackMatcherPanelRegistryPersistenceRecord = {
  recordId: string;
  entityKind: TrackMatcherPanelRegistryPersistenceEntityKind;
  storageKind: TrackMatcherPanelRegistryPersistenceStorageKind;
  status: TrackMatcherPanelRegistryPersistenceRecordStatus;
  createdAtIso: string;
  updatedAtIso: string;
  label: string;
  payload: string;
  checksum: string;
  version: number;
  tags: string[];
};

export type TrackMatcherPanelRegistryPersistenceIndex = {
  indexId: string;
  createdAtIso: string;
  updatedAtIso: string;
  records: TrackMatcherPanelRegistryPersistenceRecord[];
};

export type TrackMatcherPanelRegistryPersistenceSaveResult = {
  ok: boolean;
  record: TrackMatcherPanelRegistryPersistenceRecord | null;
  message: string;
};

export type TrackMatcherPanelRegistryPersistenceLoadResult<TValue> = {
  ok: boolean;
  value: TValue | null;
  record: TrackMatcherPanelRegistryPersistenceRecord | null;
  message: string;
};

export type TrackMatcherPanelRegistryPersistenceArchiveResult = {
  ok: boolean;
  index: TrackMatcherPanelRegistryPersistenceIndex;
  message: string;
};

export type TrackMatcherPanelRegistryPersistencePrunePolicy = {
  maxRecords: number;
  keepArchived: boolean;
  keepCorrupt: boolean;
  keepTags: string[];
};

export type TrackMatcherPanelRegistryPersistenceSummary = {
  indexId: string;
  totalRecords: number;
  activeRecords: number;
  archivedRecords: number;
  corruptRecords: number;
  migratedRecords: number;
  diffSnapshots: number;
  diffResults: number;
  historyTimelines: number;
  unknownRecords: number;
  storageKinds: TrackMatcherPanelRegistryPersistenceStorageKind[];
  tags: string[];
  latestUpdatedAtIso: string | null;
};

export type TrackMatcherPanelRegistryPersistenceDiagnostic = {
  level: "ok" | "warning" | "error";
  title: string;
  message: string;
};

export type TrackMatcherPanelRegistryPersistenceMemoryAdapter = {
  kind: "memory";
  read: (key: string) => string | null;
  write: (key: string, value: string) => void;
  remove: (key: string) => void;
  keys: () => string[];
};

export type TrackMatcherPanelRegistryPersistenceStorageEnvelope = {
  version: 1;
  savedAtIso: string;
  index: TrackMatcherPanelRegistryPersistenceIndex;
};

export type TrackMatcherPanelRegistryPersistenceSnapshotEnvelope = {
  entityKind: "diff-snapshot";
  snapshot: TrackMatcherPanelRegistryDiffSnapshotLike;
};

export type TrackMatcherPanelRegistryPersistenceDiffEnvelope = {
  entityKind: "diff-result";
  diffResult: TrackMatcherPanelRegistryDiffResult;
};

export type TrackMatcherPanelRegistryPersistenceHistoryEnvelope = {
  entityKind: "history-timeline";
  timeline: TrackMatcherPanelRegistryHistoryTimeline;
};

export type TrackMatcherPanelRegistryPersistenceAnyEntityEnvelope =
  | TrackMatcherPanelRegistryPersistenceSnapshotEnvelope
  | TrackMatcherPanelRegistryPersistenceDiffEnvelope
  | TrackMatcherPanelRegistryPersistenceHistoryEnvelope;

export type TrackMatcherPanelRegistryPersistenceSearchQuery = {
  text?: string;
  entityKind?: TrackMatcherPanelRegistryPersistenceEntityKind;
  status?: TrackMatcherPanelRegistryPersistenceRecordStatus;
  storageKind?: TrackMatcherPanelRegistryPersistenceStorageKind;
  tag?: string;
  panelId?: TrackMatcherPanelRegistryId;
};
