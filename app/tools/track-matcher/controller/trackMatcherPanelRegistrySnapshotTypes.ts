import type { TrackMatcherPanelRegistryItem } from "./trackMatcherPanelRegistryTypes";

export const TRACK_MATCHER_PANEL_REGISTRY_SNAPSHOT_FIELDS = [
  "id",
  "zone",
  "status",
  "displayMode",
  "title",
  "subtitle",
  "description",
  "order",
  "visibility",
  "source",
  "capabilities",
  "defaultCollapsed",
  "canUserHide",
  "canUserCollapse",
  "pluginSlot",
  "notes",
] as const satisfies readonly (keyof TrackMatcherPanelRegistryItem)[];

export type TrackMatcherPanelRegistrySnapshotField =
  (typeof TRACK_MATCHER_PANEL_REGISTRY_SNAPSHOT_FIELDS)[number];

export type TrackMatcherPanelRegistrySnapshotItem = Pick<
  TrackMatcherPanelRegistryItem,
  TrackMatcherPanelRegistrySnapshotField
>;

export type TrackMatcherPanelRegistrySnapshotCounts = {
  totalPanels: number;
  byZone: Record<string, number>;
  byStatus: Record<string, number>;
  byDisplayMode: Record<string, number>;
  byVisibility: Record<string, number>;
  bySource: Record<string, number>;
  withCapabilities: number;
  withPluginSlot: number;
  defaultCollapsed: number;
  userHideable: number;
  userCollapsible: number;
};

export type TrackMatcherPanelRegistrySnapshot = {
  snapshotId: string;
  createdAtIso: string;
  label: string;
  fields: readonly TrackMatcherPanelRegistrySnapshotField[];
  counts: TrackMatcherPanelRegistrySnapshotCounts;
  panels: TrackMatcherPanelRegistrySnapshotItem[];
};

export type TrackMatcherPanelRegistrySnapshotSummary = {
  snapshotId: string;
  createdAtIso: string;
  label: string;
  totalPanels: number;
  zones: string[];
  sources: string[];
  statuses: string[];
  displayModes: string[];
  visibilityModes: string[];
};