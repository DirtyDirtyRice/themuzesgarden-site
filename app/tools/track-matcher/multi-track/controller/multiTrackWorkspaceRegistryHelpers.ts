import {
  MULTI_TRACK_WORKSPACE_REGISTRY,
} from "./multiTrackWorkspaceRegistrySeed";
import type {
  MultiTrackWorkspaceRegistryGroup,
  MultiTrackWorkspaceRegistryItem,
} from "./multiTrackWorkspaceRegistryTypes";

export function getMultiTrackWorkspaceRegistry() {
  return MULTI_TRACK_WORKSPACE_REGISTRY;
}

export function getMultiTrackWorkspaceRegistryByView(
  view: MultiTrackWorkspaceRegistryItem["view"],
) {
  return MULTI_TRACK_WORKSPACE_REGISTRY.filter(
    (item) => item.view === view,
  );
}

export function createMultiTrackWorkspaceGroups(): MultiTrackWorkspaceRegistryGroup[] {
  const views = [
    "tracks",
    "comparison",
    "metadata",
    "timeline",
    "save",
    "ai",
  ] as const;

  return views.map((view) => ({
    label: view,
    items: getMultiTrackWorkspaceRegistryByView(view),
  }));
}