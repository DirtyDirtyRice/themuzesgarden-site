import type {
  DiscoveryIndex,
  DiscoveryTrack,
} from "./playerDiscoveryTypes";

export type DiscoveryRuntime = {
  sourceTrackCount: number;
  discoveryTrackCount: number;
  builtAt: number;
  tracks: DiscoveryTrack[];
  index: DiscoveryIndex;
};

export type DiscoveryRuntimeTrackSnapshot = {
  trackId: string;
  title?: string;
  artist?: string;
  trackTagCount: number;
  momentCount: number;
  clusterCount: number;
  primaryHeat: number;
  matchedTagCount: number;
};

export type DiscoveryRuntimeCache = {
  signature: string;
  runtime: DiscoveryRuntime;
} | null;