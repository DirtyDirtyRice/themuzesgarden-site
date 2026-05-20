"use client";

export type TrackMatcherLaneOrderConfig = {
  laneId: string;
  order: number;
  group: string;
};

export const TRACK_MATCHER_LANE_ORDER_CONFIGS: TrackMatcherLaneOrderConfig[] = [
  {
    laneId: "deck-a",
    order: 10,
    group: "active-comparison",
  },
  {
    laneId: "deck-b",
    order: 20,
    group: "active-comparison",
  },
  {
    laneId: "reference-song",
    order: 30,
    group: "future-reference",
  },
  {
    laneId: "stem-bus",
    order: 40,
    group: "future-stems",
  },
  {
    laneId: "generated-candidate",
    order: 50,
    group: "future-generation",
  },
];

export function getTrackMatcherLaneOrderConfigs() {
  return TRACK_MATCHER_LANE_ORDER_CONFIGS;
}

export function getTrackMatcherLaneOrder(laneId: string) {
  return (
    TRACK_MATCHER_LANE_ORDER_CONFIGS.find((config) => config.laneId === laneId)
      ?.order ?? 999
  );
}

export function compareTrackMatcherLaneOrder(aLaneId: string, bLaneId: string) {
  return getTrackMatcherLaneOrder(aLaneId) - getTrackMatcherLaneOrder(bLaneId);
}