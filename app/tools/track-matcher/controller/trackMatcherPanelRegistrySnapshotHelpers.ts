import type { TrackMatcherPanelRegistryItem } from "./trackMatcherPanelRegistryTypes";
import {
  TRACK_MATCHER_PANEL_REGISTRY_SNAPSHOT_FIELDS,
  type TrackMatcherPanelRegistrySnapshot,
  type TrackMatcherPanelRegistrySnapshotCounts,
  type TrackMatcherPanelRegistrySnapshotItem,
  type TrackMatcherPanelRegistrySnapshotSummary,
} from "./trackMatcherPanelRegistrySnapshotTypes";

function incrementCount(map: Record<string, number>, key: unknown) {
  const safeKey = String(key || "unknown");
  map[safeKey] = (map[safeKey] || 0) + 1;
}

function getSortedKeys(map: Record<string, number>) {
  return Object.keys(map).sort((a, b) => a.localeCompare(b));
}

function createSnapshotId(createdAtIso: string, totalPanels: number) {
  return `track-matcher-panel-registry-${createdAtIso}-${totalPanels}`;
}

function getPanelOrder(panel: Pick<TrackMatcherPanelRegistryItem, "order">) {
  return typeof panel.order === "number" && Number.isFinite(panel.order)
    ? panel.order
    : 0;
}

function getPanelCapabilities(
  panel: Pick<TrackMatcherPanelRegistryItem, "capabilities">,
) {
  return Array.isArray(panel.capabilities) ? panel.capabilities : [];
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function copySnapshotItem(
  panel: TrackMatcherPanelRegistryItem,
): TrackMatcherPanelRegistrySnapshotItem {
  return {
    id: panel.id,
    zone: panel.zone,
    status: panel.status,
    displayMode: panel.displayMode,
    title: panel.title,
    subtitle: panel.subtitle,
    description: panel.description,
    order: panel.order,
    visibility: panel.visibility,
    source: panel.source,
    capabilities: panel.capabilities,
    defaultCollapsed: panel.defaultCollapsed,
    canUserHide: panel.canUserHide,
    canUserCollapse: panel.canUserCollapse,
    pluginSlot: panel.pluginSlot,
    notes: panel.notes,
  };
}

function sortSnapshotItems(
  panels: TrackMatcherPanelRegistrySnapshotItem[],
): TrackMatcherPanelRegistrySnapshotItem[] {
  return [...panels].sort((a, b) => {
    if (a.zone !== b.zone) return String(a.zone).localeCompare(String(b.zone));
    if (getPanelOrder(a) !== getPanelOrder(b)) {
      return getPanelOrder(a) - getPanelOrder(b);
    }
    return String(a.id).localeCompare(String(b.id));
  });
}

export function createTrackMatcherPanelRegistrySnapshotCounts(
  panels: readonly TrackMatcherPanelRegistrySnapshotItem[],
): TrackMatcherPanelRegistrySnapshotCounts {
  const counts: TrackMatcherPanelRegistrySnapshotCounts = {
    totalPanels: panels.length,
    byZone: {},
    byStatus: {},
    byDisplayMode: {},
    byVisibility: {},
    bySource: {},
    withCapabilities: 0,
    withPluginSlot: 0,
    defaultCollapsed: 0,
    userHideable: 0,
    userCollapsible: 0,
  };

  for (const panel of panels) {
    incrementCount(counts.byZone, panel.zone);
    incrementCount(counts.byStatus, panel.status);
    incrementCount(counts.byDisplayMode, panel.displayMode);
    incrementCount(counts.byVisibility, panel.visibility);
    incrementCount(counts.bySource, panel.source);

    if (getPanelCapabilities(panel).length > 0) counts.withCapabilities += 1;
    if (hasText(panel.pluginSlot)) counts.withPluginSlot += 1;
    if (panel.defaultCollapsed === true) counts.defaultCollapsed += 1;
    if (panel.canUserHide === true) counts.userHideable += 1;
    if (panel.canUserCollapse === true) counts.userCollapsible += 1;
  }

  return counts;
}

export function createTrackMatcherPanelRegistrySnapshot(
  registry: readonly TrackMatcherPanelRegistryItem[],
  label = "Current Track Matcher panel registry",
): TrackMatcherPanelRegistrySnapshot {
  const createdAtIso = new Date().toISOString();
  const panels = sortSnapshotItems(registry.map(copySnapshotItem));

  return {
    snapshotId: createSnapshotId(createdAtIso, panels.length),
    createdAtIso,
    label,
    fields: TRACK_MATCHER_PANEL_REGISTRY_SNAPSHOT_FIELDS,
    counts: createTrackMatcherPanelRegistrySnapshotCounts(panels),
    panels,
  };
}

export function summarizeTrackMatcherPanelRegistrySnapshot(
  snapshot: TrackMatcherPanelRegistrySnapshot,
): TrackMatcherPanelRegistrySnapshotSummary {
  return {
    snapshotId: snapshot.snapshotId,
    createdAtIso: snapshot.createdAtIso,
    label: snapshot.label,
    totalPanels: snapshot.counts.totalPanels,
    zones: getSortedKeys(snapshot.counts.byZone),
    sources: getSortedKeys(snapshot.counts.bySource),
    statuses: getSortedKeys(snapshot.counts.byStatus),
    displayModes: getSortedKeys(snapshot.counts.byDisplayMode),
    visibilityModes: getSortedKeys(snapshot.counts.byVisibility),
  };
}

export function getTrackMatcherPanelRegistrySnapshotPanelIds(
  snapshot: TrackMatcherPanelRegistrySnapshot,
) {
  return snapshot.panels.map((panel) => panel.id);
}

export function findTrackMatcherPanelRegistrySnapshotPanel(
  snapshot: TrackMatcherPanelRegistrySnapshot,
  panelId: TrackMatcherPanelRegistryItem["id"],
) {
  return snapshot.panels.find((panel) => panel.id === panelId) || null;
}

export function filterTrackMatcherPanelRegistrySnapshotByZone(
  snapshot: TrackMatcherPanelRegistrySnapshot,
  zone: TrackMatcherPanelRegistryItem["zone"],
) {
  return snapshot.panels.filter((panel) => panel.zone === zone);
}

export function filterTrackMatcherPanelRegistrySnapshotBySource(
  snapshot: TrackMatcherPanelRegistrySnapshot,
  source: TrackMatcherPanelRegistryItem["source"],
) {
  return snapshot.panels.filter((panel) => panel.source === source);
}

export function getTrackMatcherPanelRegistrySnapshotCapabilities(
  snapshot: TrackMatcherPanelRegistrySnapshot,
) {
  const capabilitySet = new Set<string>();

  for (const panel of snapshot.panels) {
    for (const capability of getPanelCapabilities(panel)) {
      if (hasText(capability)) capabilitySet.add(capability.trim());
    }
  }

  return [...capabilitySet].sort((a, b) => a.localeCompare(b));
}

export function getTrackMatcherPanelRegistrySnapshotPluginSlots(
  snapshot: TrackMatcherPanelRegistrySnapshot,
) {
  const slotSet = new Set<string>();

  for (const panel of snapshot.panels) {
    if (hasText(panel.pluginSlot)) slotSet.add(panel.pluginSlot.trim());
  }

  return [...slotSet].sort((a, b) => a.localeCompare(b));
}
