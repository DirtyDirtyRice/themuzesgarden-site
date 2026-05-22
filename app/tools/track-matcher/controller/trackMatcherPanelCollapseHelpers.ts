"use client";

import type {
  TrackMatcherPanelRegistryId,
  TrackMatcherPanelRegistryItem,
  TrackMatcherPanelRegistryVisibility,
} from "./trackMatcherPanelRegistryTypes";

export type TrackMatcherPanelCollapseState = Record<
  TrackMatcherPanelRegistryId,
  boolean
>;

export type TrackMatcherPanelCollapseSummary = {
  totalPanels: number;
  collapsiblePanels: number;
  collapsedPanels: number;
  expandedPanels: number;
};

export function isTrackMatcherPanelCollapsible(
  panel: TrackMatcherPanelRegistryItem,
) {
  return panel.visibility !== "hidden-from-stack" && panel.displayMode !== "compact";
}

export function shouldTrackMatcherPanelStartCollapsed(
  panel: TrackMatcherPanelRegistryItem,
) {
  return panel.defaultCollapsed === true || panel.visibility === "collapsed";
}

export function createTrackMatcherPanelInitialCollapseState(
  panels: TrackMatcherPanelRegistryItem[],
): TrackMatcherPanelCollapseState {
  return panels.reduce<TrackMatcherPanelCollapseState>((state, panel) => {
    state[panel.id] = shouldTrackMatcherPanelStartCollapsed(panel);
    return state;
  }, {} as TrackMatcherPanelCollapseState);
}

export function toggleTrackMatcherPanelCollapseState(
  state: TrackMatcherPanelCollapseState,
  panelId: TrackMatcherPanelRegistryId,
): TrackMatcherPanelCollapseState {
  return {
    ...state,
    [panelId]: !state[panelId],
  };
}

export function setTrackMatcherPanelCollapseState(
  state: TrackMatcherPanelCollapseState,
  panelId: TrackMatcherPanelRegistryId,
  collapsed: boolean,
): TrackMatcherPanelCollapseState {
  return {
    ...state,
    [panelId]: collapsed,
  };
}

export function expandAllTrackMatcherPanels(
  panels: TrackMatcherPanelRegistryItem[],
): TrackMatcherPanelCollapseState {
  return panels.reduce<TrackMatcherPanelCollapseState>((state, panel) => {
    state[panel.id] = false;
    return state;
  }, {} as TrackMatcherPanelCollapseState);
}

export function collapseAllTrackMatcherPanels(
  panels: TrackMatcherPanelRegistryItem[],
): TrackMatcherPanelCollapseState {
  return panels.reduce<TrackMatcherPanelCollapseState>((state, panel) => {
    state[panel.id] = isTrackMatcherPanelCollapsible(panel);
    return state;
  }, {} as TrackMatcherPanelCollapseState);
}

export function getTrackMatcherPanelEffectiveVisibility(
  panel: TrackMatcherPanelRegistryItem,
  collapseState: TrackMatcherPanelCollapseState,
): TrackMatcherPanelRegistryVisibility {
  if (panel.visibility === "hidden-from-stack") {
    return "hidden-from-stack";
  }

  if (collapseState[panel.id]) {
    return "collapsed";
  }

  return "visible";
}

export function createTrackMatcherPanelCollapseSummary(
  panels: TrackMatcherPanelRegistryItem[],
  collapseState: TrackMatcherPanelCollapseState,
): TrackMatcherPanelCollapseSummary {
  const collapsiblePanels = panels.filter(isTrackMatcherPanelCollapsible);
  const collapsedPanels = collapsiblePanels.filter((panel) => collapseState[panel.id]);
  const expandedPanels = collapsiblePanels.filter((panel) => !collapseState[panel.id]);

  return {
    totalPanels: panels.length,
    collapsiblePanels: collapsiblePanels.length,
    collapsedPanels: collapsedPanels.length,
    expandedPanels: expandedPanels.length,
  };
}

export function getTrackMatcherPanelCollapseButtonLabel(
  panel: TrackMatcherPanelRegistryItem,
  collapseState: TrackMatcherPanelCollapseState,
) {
  return collapseState[panel.id] ? `Expand ${panel.title}` : `Collapse ${panel.title}`;
}

export function getTrackMatcherPanelCollapseBadgeLabel(
  panel: TrackMatcherPanelRegistryItem,
  collapseState: TrackMatcherPanelCollapseState,
) {
  if (!isTrackMatcherPanelCollapsible(panel)) {
    return "Fixed";
  }

  return collapseState[panel.id] ? "Collapsed" : "Expanded";
}
