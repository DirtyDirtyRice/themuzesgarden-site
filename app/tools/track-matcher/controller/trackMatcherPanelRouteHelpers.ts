"use client";

import type {
  TrackMatcherPanelRegistryId,
  TrackMatcherPanelRegistryItem,
  TrackMatcherPanelRegistryZone,
} from "./trackMatcherPanelRegistryTypes";
import {
  getTrackMatcherPanelSourceLabel,
  getTrackMatcherPanelZoneLabel,
} from "./trackMatcherPanelRegistryTypes";

export type TrackMatcherPanelRouteNode = {
  id: TrackMatcherPanelRegistryId;
  title: string;
  zone: TrackMatcherPanelRegistryZone;
  zoneLabel: string;
  order: number;
  routeLabel: string;
  searchText: string;
};

export type TrackMatcherPanelRouteSummary = {
  totalRoutes: number;
  routedZones: number;
  firstRoute: string;
  lastRoute: string;
};

function normalizeTrackMatcherPanelRouteSearchText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

export function createTrackMatcherPanelRouteLabel(
  panel: TrackMatcherPanelRegistryItem,
) {
  return `${getTrackMatcherPanelZoneLabel(panel.zone)} > ${panel.title}`;
}

export function createTrackMatcherPanelRouteSearchText(
  panel: TrackMatcherPanelRegistryItem,
) {
  const zoneLabel = getTrackMatcherPanelZoneLabel(panel.zone);
  const sourceLabel = getTrackMatcherPanelSourceLabel(panel.source ?? "core");

  return normalizeTrackMatcherPanelRouteSearchText(
    [
      panel.id,
      panel.title,
      panel.subtitle,
      panel.description,
      panel.zone,
      zoneLabel,
      panel.status,
      panel.displayMode,
      panel.visibility,
      panel.source,
      sourceLabel,
      panel.pluginSlot,
      ...(panel.capabilities ?? []),
      ...(panel.notes ?? []),
    ]
      .filter(Boolean)
      .join(" "),
  );
}

export function createTrackMatcherPanelRouteNode(
  panel: TrackMatcherPanelRegistryItem,
): TrackMatcherPanelRouteNode {
  const zoneLabel = getTrackMatcherPanelZoneLabel(panel.zone);

  return {
    id: panel.id,
    title: panel.title,
    zone: panel.zone,
    zoneLabel,
    order: panel.order,
    routeLabel: createTrackMatcherPanelRouteLabel(panel),
    searchText: createTrackMatcherPanelRouteSearchText(panel),
  };
}

export function createTrackMatcherPanelRouteNodes(
  panels: TrackMatcherPanelRegistryItem[],
) {
  return panels.map(createTrackMatcherPanelRouteNode);
}

export function searchTrackMatcherPanelRoutes(
  panels: TrackMatcherPanelRegistryItem[],
  query: string,
) {
  const normalizedQuery = normalizeTrackMatcherPanelRouteSearchText(query);

  if (!normalizedQuery) {
    return createTrackMatcherPanelRouteNodes(panels);
  }

  return createTrackMatcherPanelRouteNodes(panels).filter((node) =>
    node.searchText.includes(normalizedQuery),
  );
}

export function getTrackMatcherPanelRouteById(
  panels: TrackMatcherPanelRegistryItem[],
  id: TrackMatcherPanelRegistryId,
) {
  return (
    createTrackMatcherPanelRouteNodes(panels).find((node) => node.id === id) ??
    null
  );
}

export function filterTrackMatcherPanelRoutesByZone(
  panels: TrackMatcherPanelRegistryItem[],
  zone: TrackMatcherPanelRegistryZone,
) {
  return createTrackMatcherPanelRouteNodes(
    panels.filter((panel) => panel.zone === zone),
  );
}

export function filterTrackMatcherPanelRoutesBySearchText(
  panels: TrackMatcherPanelRegistryItem[],
  query: string,
) {
  return searchTrackMatcherPanelRoutes(panels, query);
}

export function createTrackMatcherPanelRouteSummary(
  panels: TrackMatcherPanelRegistryItem[],
): TrackMatcherPanelRouteSummary {
  const nodes = createTrackMatcherPanelRouteNodes(panels);
  const zoneLabels = new Set(nodes.map((node) => node.zoneLabel));

  return {
    totalRoutes: nodes.length,
    routedZones: zoneLabels.size,
    firstRoute: nodes[0]?.routeLabel ?? "No routes registered",
    lastRoute: nodes[nodes.length - 1]?.routeLabel ?? "No routes registered",
  };
}

export function createTrackMatcherPanelRouteDebugText(
  panels: TrackMatcherPanelRegistryItem[],
) {
  const summary = createTrackMatcherPanelRouteSummary(panels);

  return [
    `${summary.totalRoutes} routes`,
    `${summary.routedZones} routed zones`,
    `first: ${summary.firstRoute}`,
    `last: ${summary.lastRoute}`,
  ].join(" / ");
}

export function createTrackMatcherPanelRouteDebugRows(
  panels: TrackMatcherPanelRegistryItem[],
) {
  return panels.map((panel) => ({
    id: panel.id,
    title: panel.title,
    zone: panel.zone,
    zoneLabel: getTrackMatcherPanelZoneLabel(panel.zone),
    status: panel.status,
    displayMode: panel.displayMode,
    visibility: panel.visibility ?? "visible",
    source: panel.source ?? "core",
    sourceLabel: getTrackMatcherPanelSourceLabel(panel.source ?? "core"),
    pluginSlot: panel.pluginSlot ?? "unassigned",
    capabilities: panel.capabilities ?? [],
    notes: panel.notes ?? [],
    routeLabel: createTrackMatcherPanelRouteLabel(panel),
    searchText: createTrackMatcherPanelRouteSearchText(panel),
  }));
}
