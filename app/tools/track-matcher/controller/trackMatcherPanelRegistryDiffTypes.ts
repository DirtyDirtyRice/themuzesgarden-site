import type {
  TrackMatcherPanelRegistryCapability,
  TrackMatcherPanelRegistryDisplayMode,
  TrackMatcherPanelRegistryId,
  TrackMatcherPanelRegistrySource,
  TrackMatcherPanelRegistryStatus,
  TrackMatcherPanelRegistryVisibility,
  TrackMatcherPanelRegistryZone,
} from "./trackMatcherPanelRegistryTypes";

export type TrackMatcherPanelRegistryDiffSeverity =
  | "info"
  | "warning"
  | "breaking";

export type TrackMatcherPanelRegistryDiffKind =
  | "panel-added"
  | "panel-removed"
  | "zone-changed"
  | "status-changed"
  | "display-mode-changed"
  | "visibility-changed"
  | "source-changed"
  | "order-changed"
  | "title-changed"
  | "subtitle-changed"
  | "description-changed"
  | "capability-added"
  | "capability-removed"
  | "default-collapsed-changed"
  | "user-hideable-changed"
  | "user-collapsible-changed"
  | "plugin-slot-changed"
  | "notes-changed";

export type TrackMatcherPanelRegistryDiffValue =
  | string
  | number
  | boolean
  | null
  | readonly string[];

export type TrackMatcherPanelRegistryDiffEntry = {
  kind: TrackMatcherPanelRegistryDiffKind;
  severity: TrackMatcherPanelRegistryDiffSeverity;
  panelId: TrackMatcherPanelRegistryId;
  field: string;
  before: TrackMatcherPanelRegistryDiffValue;
  after: TrackMatcherPanelRegistryDiffValue;
  message: string;
};

export type TrackMatcherPanelRegistryDiffPanelSnapshot = {
  id: TrackMatcherPanelRegistryId;
  zone: TrackMatcherPanelRegistryZone;
  status: TrackMatcherPanelRegistryStatus;
  displayMode: TrackMatcherPanelRegistryDisplayMode;
  title: string;
  subtitle: string;
  description: string;
  order: number;
  visibility: TrackMatcherPanelRegistryVisibility | null;
  source: TrackMatcherPanelRegistrySource | null;
  capabilities: TrackMatcherPanelRegistryCapability[];
  defaultCollapsed: boolean | null;
  canUserHide: boolean | null;
  canUserCollapse: boolean | null;
  pluginSlot: string | null;
  notes: string[];
};

export type TrackMatcherPanelRegistryDiffSnapshotLike = {
  snapshotId: string;
  createdAtIso: string;
  label: string;
  panels: readonly TrackMatcherPanelRegistryDiffPanelSnapshot[];
};

export type TrackMatcherPanelRegistryDiffResult = {
  beforeSnapshotId: string;
  afterSnapshotId: string;
  comparedAtIso: string;
  entries: TrackMatcherPanelRegistryDiffEntry[];
};

export type TrackMatcherPanelRegistryDiffSummary = {
  beforeSnapshotId: string;
  afterSnapshotId: string;
  comparedAtIso: string;
  totalChanges: number;
  addedPanels: number;
  removedPanels: number;
  breakingChanges: number;
  warningChanges: number;
  infoChanges: number;
  capabilityChanges: number;
  visibilityChanges: number;
  pluginSlotChanges: number;
  changedPanelIds: TrackMatcherPanelRegistryId[];
};

export type TrackMatcherPanelRegistryDiffDiagnostic = {
  level: "ok" | "warning" | "error";
  title: string;
  message: string;
};
