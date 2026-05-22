import type { TrackMatcherPanelRegistryItem } from "./trackMatcherPanelRegistryTypes";

function normalizeSearchText(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function getPanelCapabilities(panel: TrackMatcherPanelRegistryItem) {
  return Array.isArray(panel.capabilities) ? panel.capabilities : [];
}

function getPanelOrder(panel: TrackMatcherPanelRegistryItem) {
  return typeof panel.order === "number" && Number.isFinite(panel.order)
    ? panel.order
    : 0;
}

function getPanelSearchParts(panel: TrackMatcherPanelRegistryItem) {
  return [
    panel.id,
    panel.zone,
    panel.status,
    panel.displayMode,
    panel.title,
    panel.subtitle,
    panel.description,
    panel.visibility,
    panel.source,
    panel.pluginSlot,
    panel.notes,
    ...getPanelCapabilities(panel),
  ];
}

function getPanelSearchText(panel: TrackMatcherPanelRegistryItem) {
  return getPanelSearchParts(panel)
    .map(normalizeSearchText)
    .filter(Boolean)
    .join(" ");
}

function getQueryTerms(query: string) {
  return normalizeSearchText(query)
    .split(/\s+/g)
    .map((term) => term.trim())
    .filter(Boolean);
}

function scorePanelSearchMatch(
  panel: TrackMatcherPanelRegistryItem,
  queryTerms: readonly string[],
) {
  if (queryTerms.length === 0) return 0;

  const title = normalizeSearchText(panel.title);
  const subtitle = normalizeSearchText(panel.subtitle);
  const description = normalizeSearchText(panel.description);
  const id = normalizeSearchText(panel.id);
  const zone = normalizeSearchText(panel.zone);
  const source = normalizeSearchText(panel.source);
  const fullText = getPanelSearchText(panel);
  let score = 0;

  for (const term of queryTerms) {
    if (id === term) score += 100;
    if (title === term) score += 80;
    if (title.includes(term)) score += 40;
    if (subtitle.includes(term)) score += 24;
    if (description.includes(term)) score += 16;
    if (zone.includes(term)) score += 12;
    if (source.includes(term)) score += 12;
    if (fullText.includes(term)) score += 8;
  }

  return score;
}

function sortPanelsForDisplay(
  panels: readonly TrackMatcherPanelRegistryItem[],
) {
  return [...panels].sort((a, b) => {
    if (a.zone !== b.zone) return String(a.zone).localeCompare(String(b.zone));
    if (getPanelOrder(a) !== getPanelOrder(b)) {
      return getPanelOrder(a) - getPanelOrder(b);
    }
    return String(a.title || a.id).localeCompare(String(b.title || b.id));
  });
}

export function searchTrackMatcherPanelRegistry(
  registry: readonly TrackMatcherPanelRegistryItem[],
  query: string,
) {
  const queryTerms = getQueryTerms(query);

  if (queryTerms.length === 0) {
    return sortPanelsForDisplay(registry);
  }

  return registry
    .map((panel) => ({
      panel,
      score: scorePanelSearchMatch(panel, queryTerms),
    }))
    .filter((result) => result.score > 0)
    .sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      if (a.panel.zone !== b.panel.zone) {
        return String(a.panel.zone).localeCompare(String(b.panel.zone));
      }
      if (getPanelOrder(a.panel) !== getPanelOrder(b.panel)) {
        return getPanelOrder(a.panel) - getPanelOrder(b.panel);
      }
      return String(a.panel.id).localeCompare(String(b.panel.id));
    })
    .map((result) => result.panel);
}

export function getTrackMatcherPanelSearchText(
  panel: TrackMatcherPanelRegistryItem,
) {
  return getPanelSearchText(panel);
}

export function filterTrackMatcherPanelRegistryByCapability(
  registry: readonly TrackMatcherPanelRegistryItem[],
  capability: string,
) {
  const targetCapability = normalizeSearchText(capability);

  if (!targetCapability) return sortPanelsForDisplay(registry);

  return sortPanelsForDisplay(
    registry.filter((panel) =>
      getPanelCapabilities(panel).some(
        (panelCapability) =>
          normalizeSearchText(panelCapability) === targetCapability,
      ),
    ),
  );
}

export function filterTrackMatcherPanelRegistryBySource(
  registry: readonly TrackMatcherPanelRegistryItem[],
  source: TrackMatcherPanelRegistryItem["source"],
) {
  return sortPanelsForDisplay(
    registry.filter((panel) => panel.source === source),
  );
}

export function filterTrackMatcherPanelRegistryByVisibility(
  registry: readonly TrackMatcherPanelRegistryItem[],
  visibility: TrackMatcherPanelRegistryItem["visibility"],
) {
  return sortPanelsForDisplay(
    registry.filter((panel) => panel.visibility === visibility),
  );
}

export function filterTrackMatcherPanelRegistryByZone(
  registry: readonly TrackMatcherPanelRegistryItem[],
  zone: TrackMatcherPanelRegistryItem["zone"],
) {
  return sortPanelsForDisplay(registry.filter((panel) => panel.zone === zone));
}

export function getTrackMatcherPanelRegistrySearchTokens(
  registry: readonly TrackMatcherPanelRegistryItem[],
) {
  const tokenSet = new Set<string>();

  for (const panel of registry) {
    for (const part of getPanelSearchParts(panel)) {
      const normalized = normalizeSearchText(part);
      if (!normalized) continue;

      for (const token of normalized.split(/\s+/g)) {
        if (token.trim()) tokenSet.add(token.trim());
      }
    }
  }

  return [...tokenSet].sort((a, b) => a.localeCompare(b));
}
