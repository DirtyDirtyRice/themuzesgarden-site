import type { AnyTrack } from "./playerTypes";

export type DiscoveryMoment = {
  trackId: string;
  sectionId: string;
  startTime: number;

  label: string;
  description?: string;

  tags: string[];
};

export type DiscoveryTrack = {
  trackId: string;

  title?: string;
  artist?: string;

  trackTags: string[];

  moments: DiscoveryMoment[];
};

export type DiscoveryIndex = {
  tracks: Map<string, DiscoveryTrack>;

  tagIndex: Map<string, DiscoveryMoment[]>;

  trackTagIndex: Map<string, string[]>;
};

export type DiscoveryBuildInput = {
  tracks: AnyTrack[];
};