import type { TrackMatcherPanelRegistryItem } from "./trackMatcherPanelRegistryTypes";

function getPanelOrder(panel: TrackMatcherPanelRegistryItem) {
  return typeof panel.order === "number" && Number.isFinite(panel.order)
    ? panel.order
    : 0;
}

function sortPanelsForRouteGroup(
  panels: readonly TrackMatcherPanelRegistryItem[],
) {
  return [...panels].sort((a, b) => {
    if (getPanelOrder(a) !== getPanelOrder(b)) {
      return getPanelOrder(a) - getPanelOrder(b);
    }
    return String(a.id).localeCompare(String(b.id));
  });
}

function addPanelToGroup(
  groups: Record<string, TrackMatcherPanelRegistryItem[]>,
  groupKey: unknown,
  panel: TrackMatcherPanelRegistryItem,
) {
  const safeGroupKey = String(groupKey || "unknown");
  groups[safeGroupKey] = groups[safeGroupKey] || [];
  groups[safeGroupKey].push(panel);
}

function sortGroupEntries(groups: Record<string, TrackMatcherPanelRegistryItem[]>) {
  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([groupKey, panels]) => ({
      groupKey,
      panels: sortPanelsForRouteGroup(panels),
      panelIds: sortPanelsForRouteGroup(panels).map((panel) => panel.id),
      count: panels.length,
    }));
}

export function groupTrackMatcherPanelsByZone(
  registry: readonly TrackMatcherPanelRegistryItem[],
) {
  const groups: Record<string, TrackMatcherPanelRegistryItem[]> = {};

  for (const panel of registry) {
    addPanelToGroup(groups, panel.zone, panel);
  }

  return sortGroupEntries(groups);
}

export function groupTrackMatcherPanelsBySource(
  registry: readonly TrackMatcherPanelRegistryItem[],
) {
  const groups: Record<string, TrackMatcherPanelRegistryItem[]> = {};

  for (const panel of registry) {
    addPanelToGroup(groups, panel.source, panel);
  }

  return sortGroupEntries(groups);
}

export function groupTrackMatcherPanelsByVisibility(
  registry: readonly TrackMatcherPanelRegistryItem[],
) {
  const groups: Record<string, TrackMatcherPanelRegistryItem[]> = {};

  for (const panel of registry) {
    addPanelToGroup(groups, panel.visibility, panel);
  }

  return sortGroupEntries(groups);
}

export function groupTrackMatcherPanelsByDisplayMode(
  registry: readonly TrackMatcherPanelRegistryItem[],
) {
  const groups: Record<string, TrackMatcherPanelRegistryItem[]> = {};

  for (const panel of registry) {
    addPanelToGroup(groups, panel.displayMode, panel);
  }

  return sortGroupEntries(groups);
}

export function getTrackMatcherPanelRouteGroupLabels(
  groups: ReturnType<typeof groupTrackMatcherPanelsByZone>,
) {
  return groups.map((group) => group.groupKey);
}

export function getTrackMatcherPanelRouteGroupPanelIds(
  groups: ReturnType<typeof groupTrackMatcherPanelsByZone>,
) {
  return groups.flatMap((group) => group.panelIds);
}

export function findTrackMatcherPanelRouteGroup(
  groups: ReturnType<typeof groupTrackMatcherPanelsByZone>,
  groupKey: string,
) {
  return groups.find((group) => group.groupKey === groupKey) || null;
}

export function getTrackMatcherPanelRouteGroupSummaryText(
  groups: ReturnType<typeof groupTrackMatcherPanelsByZone>,
) {
  return groups
    .map((group) => `${group.groupKey}: ${group.count}`)
    .join(" | ");
}
