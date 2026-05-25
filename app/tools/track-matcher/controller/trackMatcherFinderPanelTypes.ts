import type {
  TrackMatcherFinderDestination,
  TrackMatcherFinderQuery,
  TrackMatcherFinderTrackResult,
} from "./trackMatcherFinderTypes";

export type TrackMatcherFinderPanelMode = "compact" | "expanded";

export type TrackMatcherFinderPanelProps = {
  tracks?: TrackMatcherFinderTrackResult[];
  mode?: TrackMatcherFinderPanelMode;
  onLoadTrack?: (
    track: TrackMatcherFinderTrackResult,
    destination: TrackMatcherFinderDestination,
  ) => void;
};

export type TrackMatcherFinderSearchControlsProps = {
  query: TrackMatcherFinderQuery;
  resultCount: number;
  onQueryChange: (query: TrackMatcherFinderQuery) => void;
};

export type TrackMatcherFinderResultCardProps = {
  track: TrackMatcherFinderTrackResult;
  onLoadTrack?: (
    track: TrackMatcherFinderTrackResult,
    destination: TrackMatcherFinderDestination,
  ) => void;
};