"use client";

import { validateTrackMatcherPanelRegistry } from "./trackMatcherPanelDiagnostics";
import {
  createTrackMatcherPanelVisibilitySummary,
  filterTrackMatcherCollapsedPanels,
  filterTrackMatcherPanelsForStack,
  filterTrackMatcherVisiblePanels,
  getTrackMatcherPanelVisibility,
  isTrackMatcherPanelStatusRenderable,
} from "./trackMatcherPanelVisibilityHelpers";
import {
  createTrackMatcherPanelZoneSummary,
  getTrackMatcherNonEmptyPanelZoneGroups,
  sortTrackMatcherPanelsByZoneAndOrder,
} from "./trackMatcherPanelZoneHelpers";
import type {
  TrackMatcherPanelRegistryId,
  TrackMatcherPanelRegistryItem,
  TrackMatcherPanelRegistryStatus,
  TrackMatcherPanelRegistryZone,
} from "./trackMatcherPanelRegistryTypes";

export const TRACK_MATCHER_PANEL_REGISTRY: TrackMatcherPanelRegistryItem[] = [
  {
    id: "lane-registry-summary",
    zone: "summary",
    status: "active",
    displayMode: "compact",
    visibility: "visible",
    source: "registry",
    capabilities: ["summary", "registry", "diagnostics"],
    title: "Lane Registry Summary",
    subtitle: "Ready + planned lane counts",
    description:
      "Shows a lightweight count summary before the larger lane architecture panels.",
    order: 10,
    canUserHide: false,
    canUserCollapse: false,
    pluginSlot: "track-matcher.summary.registry",
    notes: [
      "This is intentionally compact so the overview can stay readable.",
      "Future panel summary cards can register beside this without touching the controller.",
    ],
  },
  {
    id: "lane-relationships",
    zone: "core",
    status: "active",
    displayMode: "full",
    visibility: "visible",
    source: "core",
    capabilities: ["relationships", "plugin-ready"],
    title: "Lane Relationships",
    subtitle: "Audio Intelligence Graph",
    description:
      "Shows the current relationship cards tied to the lane foundation.",
    order: 20,
    canUserHide: false,
    canUserCollapse: true,
    pluginSlot: "track-matcher.core.relationships",
  },
  {
    id: "lane-registry",
    zone: "architecture",
    status: "active",
    displayMode: "full",
    visibility: "visible",
    source: "registry",
    capabilities: ["registry", "plugin-ready", "diagnostics"],
    title: "Lane Registry",
    subtitle: "Multi-lane intelligence foundation",
    description:
      "Shows the full current and future lane registry for Track Matcher expansion.",
    order: 30,
    canUserHide: true,
    canUserCollapse: true,
    pluginSlot: "track-matcher.architecture.registry",
  },
  {
    id: "lane-intelligence",
    zone: "architecture",
    status: "active",
    displayMode: "full",
    visibility: "visible",
    source: "registry",
    capabilities: ["intelligence", "plugin-ready"],
    title: "Lane Intelligence",
    subtitle: "Signal map",
    description:
      "Shows mapped active and planned intelligence signals for lane workflows.",
    order: 40,
    canUserHide: true,
    canUserCollapse: true,
    pluginSlot: "track-matcher.architecture.intelligence",
  },
  {
    id: "dynamic-lanes",
    zone: "future",
    status: "active",
    displayMode: "full",
    visibility: "visible",
    source: "future-plugin",
    capabilities: ["dynamic-rendering", "plugin-ready"],
    title: "Dynamic Lanes",
    subtitle: "Registry-driven rendering",
    description:
      "Shows the dynamic lane rendering foundation for visible and future lanes.",
    order: 50,
    canUserHide: true,
    canUserCollapse: true,
    pluginSlot: "track-matcher.future.dynamic-lanes",
    notes: [
      "This is the safest home for future user-created lane systems.",
      "Generated candidate lanes can later register here without controller regrowth.",
    ],
  },
  {
    id: "lane-graph",
    zone: "future",
    status: "active",
    displayMode: "full",
    visibility: "visible",
    source: "future-plugin",
    capabilities: ["graph", "relationships", "plugin-ready"],
    title: "Lane Graph",
    subtitle: "Relationship graph map",
    description:
      "Shows graph nodes and edges for active and future lane relationships.",
    order: 60,
    canUserHide: true,
    canUserCollapse: true,
    pluginSlot: "track-matcher.future.graph",
  },
];

export function getTrackMatcherPanelRegistry() {
  return TRACK_MATCHER_PANEL_REGISTRY;
}

export function getTrackMatcherPanelRegistryItemById(
  id: TrackMatcherPanelRegistryId,
) {
  return TRACK_MATCHER_PANEL_REGISTRY.find((item) => item.id === id) ?? null;
}

export function getTrackMatcherActivePanelRegistryItems() {
  return TRACK_MATCHER_PANEL_REGISTRY.filter((item) => item.status === "active");
}

export function getTrackMatcherRenderablePanelRegistryItems() {
  return TRACK_MATCHER_PANEL_REGISTRY.filter((item) =>
    isTrackMatcherPanelStatusRenderable(item.status),
  );
}

export function getTrackMatcherPanelRegistryItemsByStatus(
  status: TrackMatcherPanelRegistryStatus,
) {
  return TRACK_MATCHER_PANEL_REGISTRY.filter((item) => item.status === status);
}

export function getTrackMatcherPanelRegistryItemsByZone(
  zone: TrackMatcherPanelRegistryZone,
) {
  return TRACK_MATCHER_PANEL_REGISTRY.filter((item) => item.zone === zone);
}

export function sortTrackMatcherPanelRegistryItems(
  items: TrackMatcherPanelRegistryItem[],
) {
  return sortTrackMatcherPanelsByZoneAndOrder(items);
}

export function getTrackMatcherOrderedActivePanelRegistryItems() {
  return sortTrackMatcherPanelRegistryItems(
    getTrackMatcherActivePanelRegistryItems(),
  );
}

export function getTrackMatcherOrderedRenderablePanelRegistryItems() {
  return sortTrackMatcherPanelRegistryItems(
    getTrackMatcherRenderablePanelRegistryItems(),
  );
}

export function getTrackMatcherOrderedStackPanelRegistryItems() {
  return filterTrackMatcherPanelsForStack(
    getTrackMatcherOrderedRenderablePanelRegistryItems(),
  );
}

export function getTrackMatcherVisiblePanelRegistryItems() {
  return filterTrackMatcherVisiblePanels(
    getTrackMatcherOrderedRenderablePanelRegistryItems(),
  );
}

export function getTrackMatcherCollapsedPanelRegistryItems() {
  return filterTrackMatcherCollapsedPanels(
    getTrackMatcherOrderedRenderablePanelRegistryItems(),
  );
}

export function getTrackMatcherPanelRegistryZoneGroups() {
  return getTrackMatcherNonEmptyPanelZoneGroups(
    getTrackMatcherOrderedStackPanelRegistryItems(),
  );
}

export function getTrackMatcherPanelRegistryZoneSummary() {
  return createTrackMatcherPanelZoneSummary(
    getTrackMatcherOrderedRenderablePanelRegistryItems(),
  );
}

export function createTrackMatcherPanelRegistrySummary() {
  const activePanels = getTrackMatcherPanelRegistryItemsByStatus("active");
  const plannedPanels = getTrackMatcherPanelRegistryItemsByStatus("planned");
  const hiddenPanels = getTrackMatcherPanelRegistryItemsByStatus("hidden");
  const visibilitySummary = createTrackMatcherPanelVisibilitySummary(
    TRACK_MATCHER_PANEL_REGISTRY,
  );
  const pluginReadyPanels = TRACK_MATCHER_PANEL_REGISTRY.filter((panel) =>
    panel.capabilities?.includes("plugin-ready"),
  );

  return {
    totalPanels: TRACK_MATCHER_PANEL_REGISTRY.length,
    activePanels: activePanels.length,
    plannedPanels: plannedPanels.length,
    hiddenPanels: hiddenPanels.length,
    visiblePanels: visibilitySummary.visiblePanels,
    collapsedPanels: visibilitySummary.collapsedPanels,
    stackHiddenPanels: visibilitySummary.stackHiddenPanels,
    pluginReadyPanels: pluginReadyPanels.length,
  };
}

export function createTrackMatcherPanelRegistryDiagnostics() {
  return validateTrackMatcherPanelRegistry(TRACK_MATCHER_PANEL_REGISTRY);
}

export function createTrackMatcherPanelRegistryRouteMap() {
  return getTrackMatcherOrderedRenderablePanelRegistryItems().map((panel) => ({
    id: panel.id,
    zone: panel.zone,
    title: panel.title,
    status: panel.status,
    displayMode: panel.displayMode,
    visibility: getTrackMatcherPanelVisibility(panel),
    pluginSlot: panel.pluginSlot ?? "unassigned",
  }));
}
