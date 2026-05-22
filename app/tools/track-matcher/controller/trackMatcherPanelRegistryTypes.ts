"use client";

export type TrackMatcherPanelRegistryId =
  | "lane-registry-summary"
  | "lane-relationships"
  | "lane-registry"
  | "lane-intelligence"
  | "dynamic-lanes"
  | "lane-graph";

export type TrackMatcherPanelRegistryZone =
  | "summary"
  | "core"
  | "architecture"
  | "future";

export type TrackMatcherPanelRegistryStatus =
  | "active"
  | "planned"
  | "hidden";

export type TrackMatcherPanelRegistryDisplayMode =
  | "full"
  | "compact"
  | "collapsed";

export type TrackMatcherPanelRegistryVisibility =
  | "visible"
  | "collapsed"
  | "hidden-from-stack";

export type TrackMatcherPanelRegistrySource =
  | "core"
  | "registry"
  | "future-plugin"
  | "user-plugin"
  | "ai-generated";

export type TrackMatcherPanelRegistryCapability =
  | "summary"
  | "relationships"
  | "registry"
  | "intelligence"
  | "dynamic-rendering"
  | "graph"
  | "plugin-ready"
  | "diagnostics";

export type TrackMatcherPanelRegistryItem = {
  id: TrackMatcherPanelRegistryId;
  zone: TrackMatcherPanelRegistryZone;
  status: TrackMatcherPanelRegistryStatus;
  displayMode: TrackMatcherPanelRegistryDisplayMode;
  title: string;
  subtitle: string;
  description: string;
  order: number;
  visibility?: TrackMatcherPanelRegistryVisibility;
  source?: TrackMatcherPanelRegistrySource;
  capabilities?: TrackMatcherPanelRegistryCapability[];
  defaultCollapsed?: boolean;
  canUserHide?: boolean;
  canUserCollapse?: boolean;
  pluginSlot?: string;
  notes?: string[];
};

export type TrackMatcherPanelZoneGroup = {
  zone: TrackMatcherPanelRegistryZone;
  label: string;
  description: string;
  panels: TrackMatcherPanelRegistryItem[];
};

export type TrackMatcherPanelRegistrySummary = {
  totalPanels: number;
  activePanels: number;
  plannedPanels: number;
  hiddenPanels: number;
  visiblePanels: number;
  collapsedPanels: number;
  stackHiddenPanels: number;
  pluginReadyPanels: number;
};

export type TrackMatcherPanelRegistryDiagnostic = {
  level: "ok" | "warning" | "error";
  title: string;
  message: string;
};

export type TrackMatcherPanelRegistryValidationResult = {
  ok: boolean;
  diagnostics: TrackMatcherPanelRegistryDiagnostic[];
};

export const TRACK_MATCHER_PANEL_ZONE_ORDER: TrackMatcherPanelRegistryZone[] = [
  "summary",
  "core",
  "architecture",
  "future",
];

export function getTrackMatcherPanelZoneLabel(
  zone: TrackMatcherPanelRegistryZone,
) {
  switch (zone) {
    case "summary":
      return "Summary";
    case "core":
      return "Core";
    case "architecture":
      return "Architecture";
    case "future":
      return "Future";
    default:
      return "Unknown";
  }
}

export function getTrackMatcherPanelZoneDescription(
  zone: TrackMatcherPanelRegistryZone,
) {
  switch (zone) {
    case "summary":
      return "Small registry health cards that explain what is active before the deeper architecture panels render.";
    case "core":
      return "Current Track Matcher lane relationship panels that remain directly useful to the visible workflow.";
    case "architecture":
      return "Reusable lane registry and lane intelligence systems that prepare the tool for larger routing.";
    case "future":
      return "Plugin-style future lane systems for generated candidates, AI injection, graph routing, stems, and user-created lanes.";
    default:
      return "Unknown panel zone.";
  }
}

export function getTrackMatcherPanelStatusLabel(
  status: TrackMatcherPanelRegistryStatus,
) {
  switch (status) {
    case "active":
      return "Active";
    case "planned":
      return "Planned";
    case "hidden":
      return "Hidden";
    default:
      return "Unknown";
  }
}

export function getTrackMatcherPanelDisplayModeLabel(
  displayMode: TrackMatcherPanelRegistryDisplayMode,
) {
  switch (displayMode) {
    case "full":
      return "Full";
    case "compact":
      return "Compact";
    case "collapsed":
      return "Collapsed";
    default:
      return "Unknown";
  }
}

export function getTrackMatcherPanelVisibilityLabel(
  visibility: TrackMatcherPanelRegistryVisibility = "visible",
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

export function getTrackMatcherPanelSourceLabel(
  source: TrackMatcherPanelRegistrySource = "core",
) {
  switch (source) {
    case "core":
      return "Core";
    case "registry":
      return "Registry";
    case "future-plugin":
      return "Future Plugin";
    case "user-plugin":
      return "User Plugin";
    case "ai-generated":
      return "AI Generated";
    default:
      return "Unknown";
  }
}
