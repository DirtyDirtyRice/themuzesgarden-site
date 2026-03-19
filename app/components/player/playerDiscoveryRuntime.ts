import type { AnyTrack } from "./playerTypes";
import { buildDiscoveryTracks } from "./playerDiscoveryBuild";
import { buildDiscoveryIndex } from "./playerDiscoveryIndex";

import { buildRuntimeSignature } from "./playerDiscoveryRuntime.shared";

import type {
  DiscoveryRuntime,
  DiscoveryRuntimeCache,
  DiscoveryRuntimeTrackSnapshot,
} from "./playerDiscoveryRuntime.types";

export type {
  DiscoveryRuntime,
  DiscoveryRuntimeTrackSnapshot,
} from "./playerDiscoveryRuntime.types";

export {
  findDiscoveryMomentsByLooseTag,
  findDiscoveryTrackIdsByLooseTrackTag,
  getAllDiscoveryMoments,
  getDiscoveryClusterCountForTrack,
  getDiscoveryMomentsForExactTag,
  getDiscoveryMomentsForTrack,
  getDiscoveryPrimaryHeatForTrack,
  getDiscoveryRuntimeSummary,
  getDiscoveryRuntimeTrackSnapshot,
  getDiscoveryTrackById,
  getDiscoveryTrackIdsForExactTrackTag,
} from "./playerDiscoveryRuntime.selectors";

let runtimeCache: DiscoveryRuntimeCache = null;

export function buildDiscoveryRuntime(allTracks: AnyTrack[]): DiscoveryRuntime {
  const safeTracks = Array.isArray(allTracks) ? allTracks : [];
  const discoveryTracks = buildDiscoveryTracks({ tracks: safeTracks });
  const index = buildDiscoveryIndex(discoveryTracks);

  return {
    sourceTrackCount: safeTracks.length,
    discoveryTrackCount: discoveryTracks.length,
    builtAt: Date.now(),
    tracks: discoveryTracks,
    index,
  };
}

export function getDiscoveryRuntime(allTracks: AnyTrack[]): DiscoveryRuntime {
  const safeTracks = Array.isArray(allTracks) ? allTracks : [];
  const signature = buildRuntimeSignature(safeTracks);

  if (runtimeCache && runtimeCache.signature === signature) {
    return runtimeCache.runtime;
  }

  const runtime = buildDiscoveryRuntime(safeTracks);
  runtimeCache = {
    signature,
    runtime,
  };

  return runtime;
}

export function clearDiscoveryRuntimeCache() {
  runtimeCache = null;
}