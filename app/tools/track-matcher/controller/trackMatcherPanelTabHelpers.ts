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
import { getTrackMatcherNonEmptyPanelZoneGroups } from "./trackMatcherPanelZoneHelpers";

export type TrackMatcherPanelTabId = TrackMatcherPanelRegistryZone | "all";

export type TrackMatcherPanelTabConfig = {
  id: TrackMatcherPanelTabId;
  label: string;
  description: string;
  panelCount: number;
};

export function createTrackMatcherPanelTabConfigs(
  panels: TrackMatcherPanelRegistryItem[],
): TrackMatcherPanelTabConfig[] {
  const groups = getTrackMatcherNonEmptyPanelZoneGroups(panels);
  const allTab: TrackMatcherPanelTabConfig = {
    id: "all",
    label: "All",
    description: "Shows every registered Track Matcher panel route.",
    panelCount: panels.length,
  };

  const zoneTabs = groups.map((group) => ({
    id: group.zone,
    label: group.label,
    description: group.description,
    panelCount: group.panels.length,
  }));

  return [allTab, ...zoneTabs];
}

export function getTrackMatcherPanelTabLabel(tabId: TrackMatcherPanelTabId) {
  if (tabId === "all") {
    return "All";
  }

  return getTrackMatcherPanelZoneLabel(tabId);
}

export function getTrackMatcherPanelTabDescription(tabId: TrackMatcherPanelTabId) {
  if (tabId === "all") {
    return "Every registered panel in the current Track Matcher panel stack.";
  }

  return getTrackMatcherPanelZoneDescription(tabId);
}

export function filterTrackMatcherPanelsByTab(
  panels: TrackMatcherPanelRegistryItem[],
  tabId: TrackMatcherPanelTabId,
) {
  if (tabId === "all") {
    return panels;
  }

  return panels.filter((panel) => panel.zone === tabId);
}

export function getTrackMatcherDefaultPanelTab(
  groups: TrackMatcherPanelZoneGroup[],
): TrackMatcherPanelTabId {
  const firstNonEmpty = groups.find((group) => group.panels.length > 0);
  return firstNonEmpty?.zone ?? "all";
}

export function isTrackMatcherPanelTabAvailable(
  tabId: TrackMatcherPanelTabId,
  panels: TrackMatcherPanelRegistryItem[],
) {
  if (tabId === "all") {
    return panels.length > 0;
  }

  return panels.some((panel) => panel.zone === tabId);
}

export function getTrackMatcherPanelTabOrderIndex(tabId: TrackMatcherPanelTabId) {
  if (tabId === "all") {
    return -1;
  }

  const index = TRACK_MATCHER_PANEL_ZONE_ORDER.indexOf(tabId);
  return index === -1 ? TRACK_MATCHER_PANEL_ZONE_ORDER.length : index;
}
