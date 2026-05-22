"use client";

import type {
  TrackMatcherPanelRegistryItem,
  TrackMatcherPanelRegistryZone,
  TrackMatcherPanelZoneGroup,
} from "./trackMatcherPanelRegistryTypes";
import {
  getTrackMatcherPanelZoneDescription,
  getTrackMatcherPanelZoneLabel,
  TRACK_MATCHER_PANEL_ZONE_ORDER,
} from "./trackMatcherPanelRegistryTypes";
import {
  createTrackMatcherPanelVisibilitySummary,
  filterTrackMatcherPanelsForStack,
  filterTrackMatcherVisiblePanels,
} from "./trackMatcherPanelVisibilityHelpers";

export type TrackMatcherPanelZoneSummary = {
  zone: TrackMatcherPanelRegistryZone;
  label: string;
  description: string;
  totalPanels: number;
  renderablePanels: number;
  visiblePanels: number;
  collapsedPanels: number;
  activePanels: number;
  plannedPanels: number;
  hiddenPanels: number;
};

export function sortTrackMatcherPanelZones(
  zones: TrackMatcherPanelRegistryZone[],
) {
  return [...zones].sort(
    (a, b) =>
      TRACK_MATCHER_PANEL_ZONE_ORDER.indexOf(a) -
      TRACK_MATCHER_PANEL_ZONE_ORDER.indexOf(b),
  );
}

export function getTrackMatcherPanelZoneOrderIndex(
  zone: TrackMatcherPanelRegistryZone,
) {
  const index = TRACK_MATCHER_PANEL_ZONE_ORDER.indexOf(zone);
  return index === -1 ? TRACK_MATCHER_PANEL_ZONE_ORDER.length : index;
}

export function sortTrackMatcherPanelsByZoneAndOrder(
  panels: TrackMatcherPanelRegistryItem[],
) {
  return [...panels].sort((a, b) => {
    const zoneDelta =
      getTrackMatcherPanelZoneOrderIndex(a.zone) -
      getTrackMatcherPanelZoneOrderIndex(b.zone);

    if (zoneDelta !== 0) {
      return zoneDelta;
    }

    if (a.order !== b.order) {
      return a.order - b.order;
    }

    return a.title.localeCompare(b.title);
  });
}

export function getTrackMatcherPanelsInZone(
  panels: TrackMatcherPanelRegistryItem[],
  zone: TrackMatcherPanelRegistryZone,
) {
  return sortTrackMatcherPanelsByZoneAndOrder(
    panels.filter((panel) => panel.zone === zone),
  );
}

export function groupTrackMatcherPanelsByZone(
  panels: TrackMatcherPanelRegistryItem[],
): TrackMatcherPanelZoneGroup[] {
  return TRACK_MATCHER_PANEL_ZONE_ORDER.map((zone) => ({
    zone,
    label: getTrackMatcherPanelZoneLabel(zone),
    description: getTrackMatcherPanelZoneDescription(zone),
    panels: getTrackMatcherPanelsInZone(panels, zone),
  }));
}

export function groupTrackMatcherRenderablePanelsByZone(
  panels: TrackMatcherPanelRegistryItem[],
): TrackMatcherPanelZoneGroup[] {
  return groupTrackMatcherPanelsByZone(filterTrackMatcherPanelsForStack(panels));
}

export function groupTrackMatcherVisiblePanelsByZone(
  panels: TrackMatcherPanelRegistryItem[],
): TrackMatcherPanelZoneGroup[] {
  return groupTrackMatcherPanelsByZone(filterTrackMatcherVisiblePanels(panels));
}

export function getTrackMatcherNonEmptyPanelZoneGroups(
  panels: TrackMatcherPanelRegistryItem[],
) {
  return groupTrackMatcherPanelsByZone(panels).filter(
    (group) => group.panels.length > 0,
  );
}

export function getTrackMatcherNonEmptyRenderablePanelZoneGroups(
  panels: TrackMatcherPanelRegistryItem[],
) {
  return groupTrackMatcherRenderablePanelsByZone(panels).filter(
    (group) => group.panels.length > 0,
  );
}

export function createTrackMatcherPanelZoneSummary(
  panels: TrackMatcherPanelRegistryItem[],
): TrackMatcherPanelZoneSummary[] {
  return groupTrackMatcherPanelsByZone(panels).map((group) => {
    const visibilitySummary = createTrackMatcherPanelVisibilitySummary(group.panels);

    return {
      zone: group.zone,
      label: group.label,
      description: group.description,
      totalPanels: group.panels.length,
      renderablePanels: visibilitySummary.renderablePanels,
      visiblePanels: visibilitySummary.visiblePanels,
      collapsedPanels: visibilitySummary.collapsedPanels,
      activePanels: group.panels.filter((panel) => panel.status === "active").length,
      plannedPanels: group.panels.filter((panel) => panel.status === "planned").length,
      hiddenPanels: group.panels.filter((panel) => panel.status === "hidden").length,
    };
  });
}

export function createTrackMatcherPanelZoneRouteMap(
  panels: TrackMatcherPanelRegistryItem[],
) {
  return getTrackMatcherNonEmptyPanelZoneGroups(panels).map((group) => ({
    zone: group.zone,
    label: group.label,
    description: group.description,
    routeIds: group.panels.map((panel) => panel.id),
    routeTitles: group.panels.map((panel) => panel.title),
  }));
}

export function getTrackMatcherPrimaryPanelZoneGroup(
  panels: TrackMatcherPanelRegistryItem[],
) {
  return groupTrackMatcherPanelsByZone(panels).find(
    (group) => group.zone === "core",
  ) ?? null;
}

export function getTrackMatcherArchitecturePanelZoneGroup(
  panels: TrackMatcherPanelRegistryItem[],
) {
  return groupTrackMatcherPanelsByZone(panels).find(
    (group) => group.zone === "architecture",
  ) ?? null;
}

export function getTrackMatcherFuturePanelZoneGroup(
  panels: TrackMatcherPanelRegistryItem[],
) {
  return groupTrackMatcherPanelsByZone(panels).find(
    (group) => group.zone === "future",
  ) ?? null;
}

export function createTrackMatcherPanelZoneDebugRows(
  panels: TrackMatcherPanelRegistryItem[],
) {
  return createTrackMatcherPanelZoneSummary(panels).map((summary) => ({
    zone: summary.zone,
    label: summary.label,
    totalPanels: summary.totalPanels,
    renderablePanels: summary.renderablePanels,
    visiblePanels: summary.visiblePanels,
    collapsedPanels: summary.collapsedPanels,
    activePanels: summary.activePanels,
    plannedPanels: summary.plannedPanels,
    hiddenPanels: summary.hiddenPanels,
  }));
}
