import {
  buildProjectTrackLookup,
  getProjectTrackResolverResult,
  resolveProjectTrackById,
  resolveProjectTracks,
  resolveProjectTracksAsMap,
  resolveUniqueProjectTracks,
} from "./projectTrackResolver";

export type ProjectTrackBridge = {
  tracks: any[];
  trackMap: Map<string, any>;
  lookup: Map<string, any>;
  missingIds: string[];
  duplicateIds: string[];
  stats: {
    requested: number;
    resolved: number;
    missing: number;
    duplicates: number;
  };
};

export async function buildProjectTrackBridge(
  projectTrackIds: string[]
): Promise<ProjectTrackBridge> {
  const result = await getProjectTrackResolverResult(projectTrackIds);
  const trackMap = await resolveProjectTracksAsMap(projectTrackIds);

  return {
    tracks: result.tracks,
    trackMap,
    lookup: result.lookup,
    missingIds: result.missingIds,
    duplicateIds: result.duplicateIds,
    stats: result.stats,
  };
}

export async function getProjectBridgeTracks(
  projectTrackIds: string[]
): Promise<any[]> {
  return resolveProjectTracks(projectTrackIds);
}

export async function getProjectBridgeTrackMap(
  projectTrackIds: string[]
): Promise<Map<string, any>> {
  return resolveProjectTracksAsMap(projectTrackIds);
}

export async function getProjectBridgeLookup(): Promise<Map<string, any>> {
  return buildProjectTrackLookup();
}

export async function getProjectBridgeTrack(
  trackId: string
): Promise<any | null> {
  return resolveProjectTrackById(trackId);
}

export async function getUniqueProjectBridgeTracks(
  projectTrackIds: string[]
): Promise<any[]> {
  return resolveUniqueProjectTracks(projectTrackIds);
}

export async function hasProjectBridgeMissingTracks(
  projectTrackIds: string[]
): Promise<boolean> {
  const bridge = await buildProjectTrackBridge(projectTrackIds);
  return bridge.missingIds.length > 0;
}

export async function getProjectBridgeStatistics(
  projectTrackIds: string[]
) {
  const bridge = await buildProjectTrackBridge(projectTrackIds);

  return {
    ...bridge.stats,
    totalReturnedTracks: bridge.tracks.length,
  };
}

export async function validateProjectBridge(
  projectTrackIds: string[]
) {
  const bridge = await buildProjectTrackBridge(projectTrackIds);

  return {
    valid: bridge.missingIds.length === 0,
    missingIds: bridge.missingIds,
    duplicateIds: bridge.duplicateIds,
    stats: bridge.stats,
  };
}