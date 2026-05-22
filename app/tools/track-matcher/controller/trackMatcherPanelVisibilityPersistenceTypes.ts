import type {
  TrackMatcherPanelRegistryId,
  TrackMatcherPanelRegistryVisibility,
} from "./trackMatcherPanelRegistryTypes";

export type TrackMatcherPanelVisibilityPersistenceSource =
  | "default"
  | "user"
  | "snapshot"
  | "migration";

export type TrackMatcherPanelVisibilityPersistenceRecord = {
  panelId: TrackMatcherPanelRegistryId;
  visibility: TrackMatcherPanelRegistryVisibility;
  isCollapsed: boolean;
  isHiddenFromStack: boolean;
  canUserHide: boolean;
  canUserCollapse: boolean;
  defaultCollapsed: boolean;
  updatedAtIso: string;
  source: TrackMatcherPanelVisibilityPersistenceSource;
};

export type TrackMatcherPanelVisibilityPersistenceSnapshot = {
  snapshotId: string;
  createdAtIso: string;
  label: string;
  records: TrackMatcherPanelVisibilityPersistenceRecord[];
};

export type TrackMatcherPanelVisibilityPersistencePatch = {
  panelId: TrackMatcherPanelRegistryId;
  visibility?: TrackMatcherPanelRegistryVisibility;
  isCollapsed?: boolean;
  isHiddenFromStack?: boolean;
  source?: TrackMatcherPanelVisibilityPersistenceSource;
  updatedAtIso?: string;
};

export type TrackMatcherPanelVisibilityPersistenceSummary = {
  snapshotId: string;
  createdAtIso: string;
  label: string;
  totalRecords: number;
  visibleRecords: number;
  collapsedRecords: number;
  hiddenFromStackRecords: number;
  userRecords: number;
  defaultRecords: number;
  snapshotRecords: number;
  migrationRecords: number;
  userHideableRecords: number;
  userCollapsibleRecords: number;
  defaultCollapsedRecords: number;
};

export type TrackMatcherPanelVisibilityPersistenceReconciliation = {
  snapshotPanelIds: TrackMatcherPanelRegistryId[];
  registryPanelIds: TrackMatcherPanelRegistryId[];
  missingFromSnapshot: TrackMatcherPanelRegistryId[];
  missingFromRegistry: TrackMatcherPanelRegistryId[];
  duplicateSnapshotPanelIds: TrackMatcherPanelRegistryId[];
};

export type TrackMatcherPanelVisibilityPersistenceDiagnostic = {
  level: "ok" | "warning" | "error";
  title: string;
  message: string;
};

export type TrackMatcherPanelVisibilityPersistenceStorageEnvelope = {
  version: 1;
  savedAtIso: string;
  snapshot: TrackMatcherPanelVisibilityPersistenceSnapshot;
};
