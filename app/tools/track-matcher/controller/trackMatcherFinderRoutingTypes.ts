import type {
  TrackMatcherFinderDestination,
  TrackMatcherFinderTrackResult,
} from "./trackMatcherFinderTypes";

export type TrackMatcherFinderRouteStatus =
  | "ready"
  | "blocked"
  | "needs-review"
  | "future";

export type TrackMatcherFinderRouteIntent =
  | "deck-load"
  | "lane-load"
  | "analysis-load"
  | "reference-load"
  | "hybrid-load";

export type TrackMatcherFinderRoutePriority =
  | "primary"
  | "recommended"
  | "optional"
  | "hidden";

export type TrackMatcherFinderRoute = {
  destination: TrackMatcherFinderDestination;
  label: string;
  shortLabel: string;
  detail: string;
  intent: TrackMatcherFinderRouteIntent;
  status: TrackMatcherFinderRouteStatus;
  priority: TrackMatcherFinderRoutePriority;
  acceptsStem: boolean;
  acceptsInstrumental: boolean;
  acceptsReference: boolean;
  acceptsHybrid: boolean;
  acceptsFullSong: boolean;
};

export type TrackMatcherFinderRouteDecision = {
  route: TrackMatcherFinderRoute;
  track: TrackMatcherFinderTrackResult;
  isRecommended: boolean;
  isAvailable: boolean;
  reason: string;
  scoreBoost: number;
};

export type TrackMatcherFinderRouteGroup = {
  id: string;
  label: string;
  detail: string;
  routes: TrackMatcherFinderRoute[];
};

export type TrackMatcherFinderCommandKind =
  | "load-track-a"
  | "load-track-b"
  | "load-lane"
  | "open-details"
  | "copy-reference"
  | "future-action";

export type TrackMatcherFinderCommand = {
  id: string;
  kind: TrackMatcherFinderCommandKind;
  trackId: string;
  destination: TrackMatcherFinderDestination;
  label: string;
  detail: string;
  disabled: boolean;
  disabledReason?: string;
};