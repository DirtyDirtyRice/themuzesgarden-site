"use client";

import type {
  TrackMatcherPanelRegistryDisplayMode,
  TrackMatcherPanelRegistryItem,
  TrackMatcherPanelRegistryStatus,
  TrackMatcherPanelRegistryVisibility,
} from "./trackMatcherPanelRegistryTypes";

export type TrackMatcherPanelVisibilityBucket = {
  visibility: TrackMatcherPanelRegistryVisibility;
  label: string;
  description: string;
  panels: TrackMatcherPanelRegistryItem[];
};

export type TrackMatcherPanelVisibilitySummary = {
  totalPanels: number;
  renderablePanels: number;
  bodyPanels: number;
  visiblePanels: number;
  collapsedPanels: number;
  stackHiddenPanels: number;
  activePanels: number;
  plannedPanels: number;
  hiddenStatusPanels: number;
};

export const TRACK_MATCHER_PANEL_VISIBILITY_ORDER: TrackMatcherPanelRegistryVisibility[] = [
  "visible",
  "collapsed",
  "hidden-from-stack",
];

export function getTrackMatcherPanelVisibilityLabel(
  visibility: TrackMatcherPanelRegistryVisibility,
) {
  switch (visibility) {
    case "visible":
      return "Visible";
    case "collapsed":
      return "Collapsed";
    case "hidden-from-stack":
      return "Hidden From Stack";
    default:
      return "Unknown";
  }
}

export function getTrackMatcherPanelVisibilityDescription(
  visibility: TrackMatcherPanelRegistryVisibility,
) {
  switch (visibility) {
    case "visible":
      return "Panel route is shown and its body is rendered in the stack.";
    case "collapsed":
      return "Panel route is shown as an architecture placeholder without rendering the heavy body.";
    case "hidden-from-stack":
      return "Panel route remains registered but is not rendered in the visible stack.";
    default:
      return "Panel visibility is not recognized by the current routing helpers.";
  }
}

export function getTrackMatcherPanelVisibility(
  panel: TrackMatcherPanelRegistryItem,
): TrackMatcherPanelRegistryVisibility {
  if (panel.visibility) {
    return panel.visibility;
  }

  if (panel.status === "hidden") {
    return "hidden-from-stack";
  }

  if (panel.displayMode === "collapsed" || panel.defaultCollapsed) {
    return "collapsed";
  }

  return "visible";
}

export function getTrackMatcherPanelDisplayMode(
  panel: TrackMatcherPanelRegistryItem,
): TrackMatcherPanelRegistryDisplayMode {
  if (getTrackMatcherPanelVisibility(panel) === "collapsed") {
    return "collapsed";
  }

  return panel.displayMode;
}

export function shouldRenderTrackMatcherPanelInStack(
  panel: TrackMatcherPanelRegistryItem,
) {
  return getTrackMatcherPanelVisibility(panel) !== "hidden-from-stack";
}

export function shouldRenderTrackMatcherPanelBody(
  panel: TrackMatcherPanelRegistryItem,
) {
  return getTrackMatcherPanelVisibility(panel) === "visible";
}

export function isTrackMatcherPanelStatusRenderable(
  status: TrackMatcherPanelRegistryStatus,
) {
  return status === "active" || status === "planned";
}

export function isTrackMatcherPanelVisible(
  panel: TrackMatcherPanelRegistryItem,
) {
  return getTrackMatcherPanelVisibility(panel) === "visible";
}

export function isTrackMatcherPanelCollapsed(
  panel: TrackMatcherPanelRegistryItem,
) {
  return getTrackMatcherPanelVisibility(panel) === "collapsed";
}

export function isTrackMatcherPanelHiddenFromStack(
  panel: TrackMatcherPanelRegistryItem,
) {
  return getTrackMatcherPanelVisibility(panel) === "hidden-from-stack";
}

export function filterTrackMatcherPanelsForStack(
  panels: TrackMatcherPanelRegistryItem[],
) {
  return panels.filter((panel) => shouldRenderTrackMatcherPanelInStack(panel));
}

export function filterTrackMatcherVisiblePanels(
  panels: TrackMatcherPanelRegistryItem[],
) {
  return panels.filter((panel) => isTrackMatcherPanelVisible(panel));
}

export function filterTrackMatcherCollapsedPanels(
  panels: TrackMatcherPanelRegistryItem[],
) {
  return panels.filter((panel) => isTrackMatcherPanelCollapsed(panel));
}

export function filterTrackMatcherStackHiddenPanels(
  panels: TrackMatcherPanelRegistryItem[],
) {
  return panels.filter((panel) => isTrackMatcherPanelHiddenFromStack(panel));
}

export function filterTrackMatcherPanelsByVisibility(
  panels: TrackMatcherPanelRegistryItem[],
  visibility: TrackMatcherPanelRegistryVisibility,
) {
  return panels.filter(
    (panel) => getTrackMatcherPanelVisibility(panel) === visibility,
  );
}

export function countTrackMatcherPanelsByVisibility(
  panels: TrackMatcherPanelRegistryItem[],
  visibility: TrackMatcherPanelRegistryVisibility,
) {
  return filterTrackMatcherPanelsByVisibility(panels, visibility).length;
}

export function createTrackMatcherPanelVisibilitySummary(
  panels: TrackMatcherPanelRegistryItem[],
): TrackMatcherPanelVisibilitySummary {
  const visiblePanels = filterTrackMatcherVisiblePanels(panels);
  const collapsedPanels = filterTrackMatcherCollapsedPanels(panels);
  const stackHiddenPanels = filterTrackMatcherStackHiddenPanels(panels);
  const renderablePanels = filterTrackMatcherPanelsForStack(panels);

  return {
    totalPanels: panels.length,
    renderablePanels: renderablePanels.length,
    bodyPanels: visiblePanels.length,
    visiblePanels: visiblePanels.length,
    collapsedPanels: collapsedPanels.length,
    stackHiddenPanels: stackHiddenPanels.length,
    activePanels: panels.filter((panel) => panel.status === "active").length,
    plannedPanels: panels.filter((panel) => panel.status === "planned").length,
    hiddenStatusPanels: panels.filter((panel) => panel.status === "hidden").length,
  };
}

export function createTrackMatcherPanelVisibilityBuckets(
  panels: TrackMatcherPanelRegistryItem[],
): TrackMatcherPanelVisibilityBucket[] {
  return TRACK_MATCHER_PANEL_VISIBILITY_ORDER.map((visibility) => ({
    visibility,
    label: getTrackMatcherPanelVisibilityLabel(visibility),
    description: getTrackMatcherPanelVisibilityDescription(visibility),
    panels: filterTrackMatcherPanelsByVisibility(panels, visibility),
  }));
}

export function getTrackMatcherNonEmptyPanelVisibilityBuckets(
  panels: TrackMatcherPanelRegistryItem[],
) {
  return createTrackMatcherPanelVisibilityBuckets(panels).filter(
    (bucket) => bucket.panels.length > 0,
  );
}

export function createTrackMatcherPanelVisibilityRouteNote(
  panel: TrackMatcherPanelRegistryItem,
) {
  const visibility = getTrackMatcherPanelVisibility(panel);
  const label = getTrackMatcherPanelVisibilityLabel(visibility);
  const displayMode = getTrackMatcherPanelDisplayMode(panel);

  if (visibility === "visible") {
    return `${panel.title} is ${label.toLowerCase()} and renders as ${displayMode}.`;
  }

  if (visibility === "collapsed") {
    return `${panel.title} is registered, but its body is collapsed for safe staged rollout.`;
  }

  return `${panel.title} is registered for future routing, but hidden from the stack.`;
}

export function createTrackMatcherPanelVisibilityDebugRows(
  panels: TrackMatcherPanelRegistryItem[],
) {
  return panels.map((panel) => ({
    id: panel.id,
    title: panel.title,
    status: panel.status,
    displayMode: getTrackMatcherPanelDisplayMode(panel),
    visibility: getTrackMatcherPanelVisibility(panel),
    rendersInStack: shouldRenderTrackMatcherPanelInStack(panel),
    rendersBody: shouldRenderTrackMatcherPanelBody(panel),
    note: createTrackMatcherPanelVisibilityRouteNote(panel),
  }));
}
