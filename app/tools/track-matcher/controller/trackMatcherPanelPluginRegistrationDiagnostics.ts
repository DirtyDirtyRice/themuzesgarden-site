import {
  getTrackMatcherPanelPluginIds,
} from "./trackMatcherPanelPluginRegistrationHelpers";
import type {
  TrackMatcherPanelPluginRegistrySnapshot,
} from "./trackMatcherPanelPluginRegistrationTypes";

export function getTrackMatcherPanelPluginRegistrationDiagnostics(
  snapshot: TrackMatcherPanelPluginRegistrySnapshot,
) {
  const pluginIds = getTrackMatcherPanelPluginIds(snapshot);

  return {
    snapshotId: snapshot.snapshotId,
    totalPlugins: snapshot.registrations.length,
    uniquePlugins: new Set(pluginIds).size,
    duplicatePlugins:
      pluginIds.length - new Set(pluginIds).size,
    createdAtIso: snapshot.createdAtIso,
  };
}

export function hasTrackMatcherPanelPluginRegistrationDuplicates(
  snapshot: TrackMatcherPanelPluginRegistrySnapshot,
) {
  const pluginIds = getTrackMatcherPanelPluginIds(snapshot);
  return new Set(pluginIds).size !== pluginIds.length;
}
