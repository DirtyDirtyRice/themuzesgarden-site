"use client";

import type {
  TrackMatcherPanelRegistryCapability,
  TrackMatcherPanelRegistryItem,
  TrackMatcherPanelRegistrySource,
} from "./trackMatcherPanelRegistryTypes";
import { getTrackMatcherPanelSourceLabel } from "./trackMatcherPanelRegistryTypes";

export type TrackMatcherPanelCapabilitySummary = {
  totalPanels: number;
  summaryPanels: number;
  relationshipPanels: number;
  registryPanels: number;
  intelligencePanels: number;
  dynamicRenderingPanels: number;
  graphPanels: number;
  pluginReadyPanels: number;
  diagnosticPanels: number;
  unassignedPanels: number;
};

export type TrackMatcherPanelSourceSummary = {
  totalPanels: number;
  corePanels: number;
  registryPanels: number;
  futurePluginPanels: number;
  userPluginPanels: number;
  aiGeneratedPanels: number;
  unassignedPanels: number;
};

export type TrackMatcherPanelCapabilityBadge = {
  capability: TrackMatcherPanelRegistryCapability;
  label: string;
  tone: string;
};

export type TrackMatcherPanelSourceBadge = {
  source: TrackMatcherPanelRegistrySource;
  label: string;
  tone: string;
};

function dedupeTrackMatcherPanelCapabilities(
  capabilities: TrackMatcherPanelRegistryCapability[],
) {
  return [...new Set(capabilities)];
}

export function getTrackMatcherPanelCapabilities(
  panel: TrackMatcherPanelRegistryItem,
): TrackMatcherPanelRegistryCapability[] {
  return dedupeTrackMatcherPanelCapabilities(panel.capabilities ?? []);
}

export function hasTrackMatcherPanelCapability(
  panel: TrackMatcherPanelRegistryItem,
  capability: TrackMatcherPanelRegistryCapability,
) {
  return getTrackMatcherPanelCapabilities(panel).includes(capability);
}

export function filterTrackMatcherPanelsByCapability(
  panels: TrackMatcherPanelRegistryItem[],
  capability: TrackMatcherPanelRegistryCapability,
) {
  return panels.filter((panel) => hasTrackMatcherPanelCapability(panel, capability));
}

export function filterTrackMatcherPanelsWithoutCapabilities(
  panels: TrackMatcherPanelRegistryItem[],
) {
  return panels.filter((panel) => getTrackMatcherPanelCapabilities(panel).length === 0);
}

export function countTrackMatcherPanelsByCapability(
  panels: TrackMatcherPanelRegistryItem[],
  capability: TrackMatcherPanelRegistryCapability,
) {
  return filterTrackMatcherPanelsByCapability(panels, capability).length;
}

export function createTrackMatcherPanelCapabilitySummary(
  panels: TrackMatcherPanelRegistryItem[],
): TrackMatcherPanelCapabilitySummary {
  return {
    totalPanels: panels.length,
    summaryPanels: countTrackMatcherPanelsByCapability(panels, "summary"),
    relationshipPanels: countTrackMatcherPanelsByCapability(
      panels,
      "relationships",
    ),
    registryPanels: countTrackMatcherPanelsByCapability(panels, "registry"),
    intelligencePanels: countTrackMatcherPanelsByCapability(
      panels,
      "intelligence",
    ),
    dynamicRenderingPanels: countTrackMatcherPanelsByCapability(
      panels,
      "dynamic-rendering",
    ),
    graphPanels: countTrackMatcherPanelsByCapability(panels, "graph"),
    pluginReadyPanels: countTrackMatcherPanelsByCapability(
      panels,
      "plugin-ready",
    ),
    diagnosticPanels: countTrackMatcherPanelsByCapability(panels, "diagnostics"),
    unassignedPanels: filterTrackMatcherPanelsWithoutCapabilities(panels).length,
  };
}

export function getTrackMatcherPanelCapabilityLabel(
  capability: TrackMatcherPanelRegistryCapability,
) {
  switch (capability) {
    case "summary":
      return "Summary";
    case "relationships":
      return "Relationships";
    case "registry":
      return "Registry";
    case "intelligence":
      return "Intelligence";
    case "dynamic-rendering":
      return "Dynamic Rendering";
    case "graph":
      return "Graph";
    case "plugin-ready":
      return "Plugin Ready";
    case "diagnostics":
      return "Diagnostics";
    default:
      return "Unknown Capability";
  }
}

export function getTrackMatcherPanelCapabilityTone(
  capability: TrackMatcherPanelRegistryCapability,
) {
  switch (capability) {
    case "summary":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-100";
    case "relationships":
      return "border-cyan-400/20 bg-cyan-400/10 text-cyan-100";
    case "registry":
      return "border-blue-400/20 bg-blue-400/10 text-blue-100";
    case "intelligence":
      return "border-fuchsia-400/20 bg-fuchsia-400/10 text-fuchsia-100";
    case "dynamic-rendering":
      return "border-violet-400/20 bg-violet-400/10 text-violet-100";
    case "graph":
      return "border-sky-400/20 bg-sky-400/10 text-sky-100";
    case "plugin-ready":
      return "border-amber-400/20 bg-amber-400/10 text-amber-100";
    case "diagnostics":
      return "border-lime-400/20 bg-lime-400/10 text-lime-100";
    default:
      return "border-white/10 bg-white/5 text-white/70";
  }
}

export function createTrackMatcherPanelCapabilityBadges(
  panel: TrackMatcherPanelRegistryItem,
): TrackMatcherPanelCapabilityBadge[] {
  return getTrackMatcherPanelCapabilities(panel).map((capability) => ({
    capability,
    label: getTrackMatcherPanelCapabilityLabel(capability),
    tone: getTrackMatcherPanelCapabilityTone(capability),
  }));
}

export function getTrackMatcherPanelPrimaryCapability(
  panel: TrackMatcherPanelRegistryItem,
): TrackMatcherPanelRegistryCapability | null {
  return getTrackMatcherPanelCapabilities(panel)[0] ?? null;
}

export function getTrackMatcherPanelPrimaryCapabilityLabel(
  panel: TrackMatcherPanelRegistryItem,
) {
  const primaryCapability = getTrackMatcherPanelPrimaryCapability(panel);

  if (!primaryCapability) {
    return "No primary capability";
  }

  return getTrackMatcherPanelCapabilityLabel(primaryCapability);
}

export function createTrackMatcherPanelCapabilityRouteText(
  panel: TrackMatcherPanelRegistryItem,
) {
  const capabilities = getTrackMatcherPanelCapabilities(panel);

  if (capabilities.length === 0) {
    return "No capabilities assigned yet.";
  }

  return capabilities.map(getTrackMatcherPanelCapabilityLabel).join(" / ");
}

export function createTrackMatcherPanelCapabilitySearchText(
  panel: TrackMatcherPanelRegistryItem,
) {
  return getTrackMatcherPanelCapabilities(panel)
    .map((capability) => getTrackMatcherPanelCapabilityLabel(capability))
    .join(" ")
    .toLowerCase();
}

export function shouldHighlightTrackMatcherPanelCapabilities(
  panel: TrackMatcherPanelRegistryItem,
) {
  const capabilities = getTrackMatcherPanelCapabilities(panel);

  return (
    capabilities.includes("plugin-ready") ||
    capabilities.includes("intelligence") ||
    capabilities.includes("dynamic-rendering") ||
    capabilities.includes("graph")
  );
}

export function getTrackMatcherPanelSource(
  panel: TrackMatcherPanelRegistryItem,
): TrackMatcherPanelRegistrySource {
  return panel.source ?? "core";
}

export function filterTrackMatcherPanelsBySource(
  panels: TrackMatcherPanelRegistryItem[],
  source: TrackMatcherPanelRegistrySource,
) {
  return panels.filter((panel) => getTrackMatcherPanelSource(panel) === source);
}

export function filterTrackMatcherPluginReadyPanels(
  panels: TrackMatcherPanelRegistryItem[],
) {
  return filterTrackMatcherPanelsByCapability(panels, "plugin-ready");
}

export function filterTrackMatcherFuturePanelSources(
  panels: TrackMatcherPanelRegistryItem[],
) {
  return panels.filter((panel) => {
    const source = getTrackMatcherPanelSource(panel);

    return (
      source === "future-plugin" ||
      source === "user-plugin" ||
      source === "ai-generated"
    );
  });
}

export function createTrackMatcherPanelSourceSummary(
  panels: TrackMatcherPanelRegistryItem[],
): TrackMatcherPanelSourceSummary {
  return {
    totalPanels: panels.length,
    corePanels: filterTrackMatcherPanelsBySource(panels, "core").length,
    registryPanels: filterTrackMatcherPanelsBySource(panels, "registry").length,
    futurePluginPanels: filterTrackMatcherPanelsBySource(
      panels,
      "future-plugin",
    ).length,
    userPluginPanels: filterTrackMatcherPanelsBySource(panels, "user-plugin")
      .length,
    aiGeneratedPanels: filterTrackMatcherPanelsBySource(panels, "ai-generated")
      .length,
    unassignedPanels: panels.filter((panel) => !panel.source).length,
  };
}

export function getTrackMatcherPanelSourceTone(
  source: TrackMatcherPanelRegistrySource,
) {
  switch (source) {
    case "core":
      return "border-white/10 bg-white/5 text-white/70";
    case "registry":
      return "border-blue-400/20 bg-blue-400/10 text-blue-100";
    case "future-plugin":
      return "border-violet-400/20 bg-violet-400/10 text-violet-100";
    case "user-plugin":
      return "border-cyan-400/20 bg-cyan-400/10 text-cyan-100";
    case "ai-generated":
      return "border-fuchsia-400/20 bg-fuchsia-400/10 text-fuchsia-100";
    default:
      return "border-white/10 bg-white/5 text-white/70";
  }
}

export function createTrackMatcherPanelSourceBadge(
  panel: TrackMatcherPanelRegistryItem,
): TrackMatcherPanelSourceBadge {
  const source = getTrackMatcherPanelSource(panel);

  return {
    source,
    label: getTrackMatcherPanelSourceLabel(source),
    tone: getTrackMatcherPanelSourceTone(source),
  };
}

export function createTrackMatcherPanelCapabilityDiagnosticText(
  panels: TrackMatcherPanelRegistryItem[],
) {
  const capabilitySummary = createTrackMatcherPanelCapabilitySummary(panels);
  const sourceSummary = createTrackMatcherPanelSourceSummary(panels);

  return [
    `${capabilitySummary.totalPanels} total panels`,
    `${capabilitySummary.pluginReadyPanels} plugin-ready`,
    `${capabilitySummary.diagnosticPanels} diagnostic`,
    `${sourceSummary.futurePluginPanels} future-plugin source`,
    `${sourceSummary.aiGeneratedPanels} AI-generated source`,
    `${capabilitySummary.unassignedPanels} capability-unassigned`,
  ].join(" / ");
}

export function createTrackMatcherPanelCapabilityDebugRows(
  panels: TrackMatcherPanelRegistryItem[],
) {
  return panels.map((panel) => ({
    id: panel.id,
    title: panel.title,
    source: getTrackMatcherPanelSource(panel),
    sourceLabel: getTrackMatcherPanelSourceLabel(getTrackMatcherPanelSource(panel)),
    capabilities: getTrackMatcherPanelCapabilities(panel),
    capabilityText: createTrackMatcherPanelCapabilityRouteText(panel),
    pluginReady: hasTrackMatcherPanelCapability(panel, "plugin-ready"),
    highlighted: shouldHighlightTrackMatcherPanelCapabilities(panel),
  }));
}
