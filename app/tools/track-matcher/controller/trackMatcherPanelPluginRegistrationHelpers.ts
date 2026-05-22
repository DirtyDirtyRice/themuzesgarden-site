import type {
  TrackMatcherPanelPluginRegistration,
  TrackMatcherPanelPluginRegistrySnapshot,
} from "./trackMatcherPanelPluginRegistrationTypes";

export function createTrackMatcherPanelPluginRegistrySnapshot(
  registrations: TrackMatcherPanelPluginRegistration[],
): TrackMatcherPanelPluginRegistrySnapshot {
  return {
    snapshotId: `plugin-registry-${Date.now()}`,
    createdAtIso: new Date().toISOString(),
    registrations: [...registrations].sort((a, b) =>
      a.pluginId.localeCompare(b.pluginId),
    ),
  };
}

export function findTrackMatcherPanelPluginRegistration(
  snapshot: TrackMatcherPanelPluginRegistrySnapshot,
  pluginId: string,
) {
  return (
    snapshot.registrations.find((item) => item.pluginId === pluginId) ?? null
  );
}

export function getTrackMatcherPanelPluginIds(
  snapshot: TrackMatcherPanelPluginRegistrySnapshot,
) {
  return snapshot.registrations.map((item) => item.pluginId);
}

export function getTrackMatcherPanelRegistrationsByStatus(
  snapshot: TrackMatcherPanelPluginRegistrySnapshot,
  status: TrackMatcherPanelPluginRegistration["status"],
) {
  return snapshot.registrations.filter((item) => item.status === status);
}

export function mergeTrackMatcherPanelPluginRegistrations(
  base: TrackMatcherPanelPluginRegistration[],
  incoming: TrackMatcherPanelPluginRegistration[],
) {
  const map = new Map<string, TrackMatcherPanelPluginRegistration>();

  for (const item of base) map.set(item.pluginId, item);
  for (const item of incoming) map.set(item.pluginId, item);

  return [...map.values()].sort((a, b) =>
    a.pluginId.localeCompare(b.pluginId),
  );
}
