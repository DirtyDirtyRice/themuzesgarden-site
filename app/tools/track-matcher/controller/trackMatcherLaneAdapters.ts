"use client";

import type { TrackMatcherLaneAdapter } from "./trackMatcherLaneAdapterTypes";

export const TRACK_MATCHER_LANE_ADAPTERS: TrackMatcherLaneAdapter[] = [
  {
    laneId: "deck-a",
    kind: "audio-input",
    status: "available",
    label: "Deck A Audio Adapter",
    description: "Connects the primary uploaded track to the lane architecture.",
  },
  {
    laneId: "deck-b",
    kind: "audio-input",
    status: "available",
    label: "Deck B Audio Adapter",
    description: "Connects the comparison uploaded track to the lane architecture.",
  },
  {
    laneId: "reference-song",
    kind: "reference-input",
    status: "planned",
    label: "Reference Song Adapter",
    description: "Reserved for reference-track lineage, influence, and style matching.",
  },
  {
    laneId: "stem-bus",
    kind: "stem-input",
    status: "planned",
    label: "Stem Bus Adapter",
    description: "Reserved for separated vocal, drum, bass, harmony, and texture stems.",
  },
  {
    laneId: "generated-candidate",
    kind: "generated-input",
    status: "planned",
    label: "Generated Candidate Adapter",
    description: "Reserved for AI output comparison and regeneration decisions.",
  },
];

export function getTrackMatcherLaneAdapters() {
  return TRACK_MATCHER_LANE_ADAPTERS;
}

export function getTrackMatcherLaneAdapterByLaneId(laneId: string) {
  return TRACK_MATCHER_LANE_ADAPTERS.find((adapter) => adapter.laneId === laneId) ?? null;
}

export function getTrackMatcherAvailableLaneAdapters() {
  return TRACK_MATCHER_LANE_ADAPTERS.filter((adapter) => adapter.status === "available");
}