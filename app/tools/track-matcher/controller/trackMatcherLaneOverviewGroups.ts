"use client";

import { DEFAULT_TRACK_MATCHER_LANES } from "./trackMatcherControllerConstants";
import {
  isTrackMatcherAnalysisLane,
  isTrackMatcherHybridLane,
  isTrackMatcherStemLane,
} from "./trackMatcherLaneHelpers";

export function getTrackMatcherLaneGroups() {
  return {
    primaryLanes: DEFAULT_TRACK_MATCHER_LANES.filter(
      (lane) =>
        lane.role === "original-idea" || lane.role === "suno-result",
    ),

    stemLanes: DEFAULT_TRACK_MATCHER_LANES.filter((lane) =>
      isTrackMatcherStemLane(lane.role),
    ),

    analysisLanes: DEFAULT_TRACK_MATCHER_LANES.filter((lane) =>
      isTrackMatcherAnalysisLane(lane.role),
    ),

    hybridLanes: DEFAULT_TRACK_MATCHER_LANES.filter((lane) =>
      isTrackMatcherHybridLane(lane.role),
    ),
  };
}