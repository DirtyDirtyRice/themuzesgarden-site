"use client";

import { TRACK_MATCHER_DYNAMIC_LANES } from "./trackMatcherDynamicLaneSeed";
import type {
  TrackMatcherDynamicLaneCategory,
  TrackMatcherDynamicLaneDefinition,
  TrackMatcherDynamicLaneHealth,
} from "./trackMatcherDynamicLaneTypes";

export function getTrackMatcherDynamicLaneById(id: string) {
  return TRACK_MATCHER_DYNAMIC_LANES.find((lane) => lane.id === id) ?? null;
}

export function getTrackMatcherVisibleDynamicLanes() {
  return TRACK_MATCHER_DYNAMIC_LANES.filter((lane) => lane.visible);
}

export function getTrackMatcherHiddenDynamicLanes() {
  return TRACK_MATCHER_DYNAMIC_LANES.filter((lane) => !lane.visible);
}

export function getTrackMatcherDynamicLanesByCategory(
  category: TrackMatcherDynamicLaneCategory,
) {
  return TRACK_MATCHER_DYNAMIC_LANES.filter(
    (lane) => lane.category === category,
  );
}

export function getTrackMatcherDynamicLanesByHealth(
  health: TrackMatcherDynamicLaneHealth,
) {
  return TRACK_MATCHER_DYNAMIC_LANES.filter(
    (lane) => lane.health === health,
  );
}

export function sortTrackMatcherDynamicLanes(
  lanes: TrackMatcherDynamicLaneDefinition[],
) {
  return [...lanes].sort((a, b) => a.order - b.order);
}

export function getTrackMatcherPlaybackDynamicLanes() {
  return TRACK_MATCHER_DYNAMIC_LANES.filter(
    (lane) => lane.supportsPlayback,
  );
}

export function getTrackMatcherAnalysisDynamicLanes() {
  return TRACK_MATCHER_DYNAMIC_LANES.filter(
    (lane) => lane.supportsAnalysis,
  );
}

export function getTrackMatcherGenerationDynamicLanes() {
  return TRACK_MATCHER_DYNAMIC_LANES.filter(
    (lane) => lane.supportsGeneration,
  );
}

export function createTrackMatcherDynamicLaneSummary() {
  const visibleCount = getTrackMatcherVisibleDynamicLanes().length;

  const hiddenCount = getTrackMatcherHiddenDynamicLanes().length;

  const playbackCount = getTrackMatcherPlaybackDynamicLanes().length;

  const analysisCount = getTrackMatcherAnalysisDynamicLanes().length;

  const generationCount = getTrackMatcherGenerationDynamicLanes().length;

  return {
    total: TRACK_MATCHER_DYNAMIC_LANES.length,
    visibleCount,
    hiddenCount,
    playbackCount,
    analysisCount,
    generationCount,
  };
}

export function groupTrackMatcherDynamicLanesByCategory() {
  const grouped: Record<
    TrackMatcherDynamicLaneCategory,
    TrackMatcherDynamicLaneDefinition[]
  > = {
    comparison: [],
    analysis: [],
    generation: [],
    stem: [],
    reference: [],
  };

  for (const lane of TRACK_MATCHER_DYNAMIC_LANES) {
    grouped[lane.category].push(lane);
  }

  return grouped;
}