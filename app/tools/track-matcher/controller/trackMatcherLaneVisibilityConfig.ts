"use client";

export type TrackMatcherLaneVisibilityMode =
  | "visible"
  | "hidden"
  | "future";

export type TrackMatcherLaneVisibilityConfig = {
  laneId: string;
  mode: TrackMatcherLaneVisibilityMode;
  reason: string;
};

export const TRACK_MATCHER_LANE_VISIBILITY_CONFIGS: TrackMatcherLaneVisibilityConfig[] = [
  {
    laneId: "deck-a",
    mode: "visible",
    reason: "Deck A remains the stable primary comparison lane.",
  },
  {
    laneId: "deck-b",
    mode: "visible",
    reason: "Deck B remains the stable comparison lane.",
  },
  {
    laneId: "reference-song",
    mode: "future",
    reason: "Reference lanes are reserved for song lineage and influence matching.",
  },
  {
    laneId: "stem-bus",
    mode: "future",
    reason: "Stem lanes wait for separation and routing systems.",
  },
  {
    laneId: "generated-candidate",
    mode: "future",
    reason: "Generated candidate lanes wait for AI output comparison workflows.",
  },
];

export function getTrackMatcherLaneVisibilityConfigs() {
  return TRACK_MATCHER_LANE_VISIBILITY_CONFIGS;
}

export function getTrackMatcherLaneVisibilityMode(laneId: string) {
  return (
    TRACK_MATCHER_LANE_VISIBILITY_CONFIGS.find((config) => config.laneId === laneId)
      ?.mode ?? "future"
  );
}

export function isTrackMatcherLaneVisible(laneId: string) {
  return getTrackMatcherLaneVisibilityMode(laneId) === "visible";
}