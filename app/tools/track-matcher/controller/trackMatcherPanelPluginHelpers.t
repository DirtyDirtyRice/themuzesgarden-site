"use client";

import type {
  TrackMatcherPanelRegistryId,
  TrackMatcherPanelRegistryItem,
  TrackMatcherPanelRegistryPluginSource,
  TrackMatcherPanelRegistryStatus,
  TrackMatcherPanelRegistryZone,
} from "./trackMatcherPanelRegistryTypes";

export type TrackMatcherPanelPluginRegistration = {
  id: TrackMatcherPanelRegistryId;
  source: TrackMatcherPanelRegistryPluginSource;
  zone: TrackMatcherPanelRegistryZone;
  status: TrackMatcherPanelRegistryStatus;
  title: string;
  subtitle: string;
  description: string;
  order?: number;
  featureFlag?: string;
  owner?: string;
  notes?: string[];
};

export type TrackMatcherPanelPluginRegistrationResult = {
  ok: boolean;
  item: TrackMatcherPanelRegistryItem | null;
  warnings: string[];
};

const DEFAULT_PLUGIN_ORDER = 900;

function normalizeTrackMatcherPluginOrder(order: number | undefined) {
  if (!Number.isFinite(order)) {
    return DEFAULT_PLUGIN_ORDER;
  }

  return Math.max(1, Math.round(order ?? DEFAULT_PLUGIN_ORDER));
}

function normalizeTrackMatcherPluginText(value: string, fallback: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

export function createTrackMatcherPanelPluginItem(
  registration: TrackMatcherPanelPluginRegistration,
): TrackMatcherPanelRegistryItem {
  return {
    id: registration.id,
    zone: registration.zone,
    status: registration.status,
    displayMode: "full",
    visibility: registration.status === "hidden" ? "hidden-from-stack" : "visible",
    pluginSource: registration.source,
    capabilityFlags: ["plugin-panel", "registry-routed"],
    title: normalizeTrackMatcherPluginText(registration.title, "Untitled Panel"),
    subtitle: normalizeTrackMatcherPluginText(
      registration.subtitle,
      "Plugin routed panel",
    ),
    description: normalizeTrackMatcherPluginText(
      registration.description,
      "Registered through the Track Matcher plugin panel helper layer.",
    ),
    order: normalizeTrackMatcherPluginOrder(registration.order),
    defaultCollapsed: false,
    featureFlag: registration.featureFlag,
    owner: registration.owner,
    notes: registration.notes ?? [],
  };
}

export function validateTrackMatcherPanelPluginRegistration(
  registration: TrackMatcherPanelPluginRegistration,
): string[] {
  const warnings: string[] = [];

  if (registration.title.trim().length === 0) {
    warnings.push("Plugin panel title is empty.");
  }

  if (registration.subtitle.trim().length === 0) {
    warnings.push("Plugin panel subtitle is empty.");
  }

  if (registration.description.trim().length === 0) {
    warnings.push("Plugin panel description is empty.");
  }

  if (registration.order !== undefined && registration.order < 1) {
    warnings.push("Plugin panel order was below 1 and will be normalized.");
  }

  if (registration.status === "hidden") {
    warnings.push("Plugin panel is registered as hidden from the visible stack.");
  }

  return warnings;
}

export function registerTrackMatcherPanelPlugin(
  registration: TrackMatcherPanelPluginRegistration,
): TrackMatcherPanelPluginRegistrationResult {
  const warnings = validateTrackMatcherPanelPluginRegistration(registration);

  return {
    ok: warnings.length === 0,
    item: createTrackMatcherPanelPluginItem(registration),
    warnings,
  };
}

export function getTrackMatcherPanelPluginSourceLabel(
  source: TrackMatcherPanelRegistryPluginSource | undefined,
) {
  switch (source) {
    case "core":
      return "Core";
    case "first-party":
      return "First-party";
    case "user-created":
      return "User-created";
    case "ai-generated":
      return "AI-generated";
    case "external-plugin":
      return "External plugin";
    default:
      return "Unassigned";
  }
}

export function isTrackMatcherPanelPluginOwned(
  panel: TrackMatcherPanelRegistryItem,
) {
  return Boolean(panel.pluginSource && panel.pluginSource !== "core");
}

export function filterTrackMatcherPluginPanels(
  panels: TrackMatcherPanelRegistryItem[],
) {
  return panels.filter((panel) => isTrackMatcherPanelPluginOwned(panel));
}

export function filterTrackMatcherPanelsByPluginSource(
  panels: TrackMatcherPanelRegistryItem[],
  source: TrackMatcherPanelRegistryPluginSource,
) {
  return panels.filter((panel) => panel.pluginSource === source);
}

export function createTrackMatcherPanelPluginSummary(
  panels: TrackMatcherPanelRegistryItem[],
) {
  const pluginPanels = filterTrackMatcherPluginPanels(panels);
  const userCreatedPanels = filterTrackMatcherPanelsByPluginSource(
    panels,
    "user-created",
  );
  const aiGeneratedPanels = filterTrackMatcherPanelsByPluginSource(
    panels,
    "ai-generated",
  );
  const externalPanels = filterTrackMatcherPanelsByPluginSource(
    panels,
    "external-plugin",
  );

  return {
    totalPluginPanels: pluginPanels.length,
    userCreatedPanels: userCreatedPanels.length,
    aiGeneratedPanels: aiGeneratedPanels.length,
    externalPanels: externalPanels.length,
  };
}

export function createTrackMatcherPanelPluginRouteLabel(
  panel: TrackMatcherPanelRegistryItem,
) {
  const source = getTrackMatcherPanelPluginSourceLabel(panel.pluginSource);
  return `${source} / ${panel.zone} / ${panel.title}`;
}
