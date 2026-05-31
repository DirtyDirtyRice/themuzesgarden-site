import type {
  MultiTrackWorkspaceRegistryGroup,
  MultiTrackWorkspaceRegistryItem,
} from "./multiTrackWorkspaceRegistryTypes";

export type MultiTrackWorkspaceRegistryMetrics = {
  totalWorkspaces: number;
  readyCount: number;
  foundationCount: number;
  plannedCount: number;
  viewCounts: Record<string, number>;
};

export function createWorkspaceRegistryMetrics(
  registry: MultiTrackWorkspaceRegistryItem[],
): MultiTrackWorkspaceRegistryMetrics {
  const readyCount = registry.filter(
    (item) => item.status === "ready",
  ).length;

  const foundationCount = registry.filter(
    (item) => item.status === "foundation",
  ).length;

  const plannedCount = registry.filter(
    (item) => item.status === "planned",
  ).length;

  const viewCounts: Record<string, number> = {};

  for (const item of registry) {
    viewCounts[item.view] = (viewCounts[item.view] ?? 0) + 1;
  }

  return {
    totalWorkspaces: registry.length,
    readyCount,
    foundationCount,
    plannedCount,
    viewCounts,
  };
}

export function createWorkspaceStatusSummary(
  metrics: MultiTrackWorkspaceRegistryMetrics,
): string {
  return [
    `${metrics.totalWorkspaces} total`,
    `${metrics.foundationCount} foundation`,
    `${metrics.readyCount} ready`,
    `${metrics.plannedCount} planned`,
  ].join(" • ");
}

export function createLargestWorkspaceGroupLabel(
  groups: MultiTrackWorkspaceRegistryGroup[],
): string {
  const largestGroup = [...groups].sort(
    (a, b) => b.items.length - a.items.length,
  )[0];

  if (!largestGroup) {
    return "No workspace groups";
  }

  return `${largestGroup.label} (${largestGroup.items.length})`;
}