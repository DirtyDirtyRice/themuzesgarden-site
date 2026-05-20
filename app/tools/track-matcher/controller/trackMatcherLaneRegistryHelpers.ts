"use client";

import {
  TRACK_MATCHER_LANE_REGISTRY,
  type TrackMatcherLaneCapability,
  type TrackMatcherLaneRegistryItem,
  type TrackMatcherLaneRole,
  type TrackMatcherLaneStatus,
} from "./trackMatcherLaneRegistry";

export function groupTrackMatcherLanesByStatus() {
  const grouped: Record<
    TrackMatcherLaneStatus,
    TrackMatcherLaneRegistryItem[]
  > = {
    ready: [],
    planned: [],
    disabled: [],
  };

  for (const lane of TRACK_MATCHER_LANE_REGISTRY) {
    grouped[lane.status].push(lane);
  }

  return grouped;
}

export function groupTrackMatcherLanesByRole() {
  const grouped: Record<
    TrackMatcherLaneRole,
    TrackMatcherLaneRegistryItem[]
  > = {
    primary: [],
    comparison: [],
    reference: [],
    stem: [],
    generated: [],
  };

  for (const lane of TRACK_MATCHER_LANE_REGISTRY) {
    grouped[lane.role].push(lane);
  }

  return grouped;
}

export function getTrackMatcherLanesWithCapability(
  capability: TrackMatcherLaneCapability,
) {
  return TRACK_MATCHER_LANE_REGISTRY.filter((lane) =>
    lane.capabilities.includes(capability),
  );
}

export function getTrackMatcherActiveLaneCount() {
  return TRACK_MATCHER_LANE_REGISTRY.filter(
    (lane) => lane.status === "ready",
  ).length;
}

export function getTrackMatcherPlannedLaneCount() {
  return TRACK_MATCHER_LANE_REGISTRY.filter(
    (lane) => lane.status === "planned",
  ).length;
}

export function getTrackMatcherLaneCapabilityMatrix() {
  return TRACK_MATCHER_LANE_REGISTRY.map((lane) => ({
    id: lane.id,
    title: lane.title,
    capabilities: lane.capabilities,
  }));
}

export function sortTrackMatcherLanesAlphabetically() {
  return [...TRACK_MATCHER_LANE_REGISTRY].sort((a, b) =>
    a.title.localeCompare(b.title),
  );
}

export function getTrackMatcherLaneTitles() {
  return TRACK_MATCHER_LANE_REGISTRY.map((lane) => lane.title);
}

export function getTrackMatcherFutureLaneTitles() {
  return TRACK_MATCHER_LANE_REGISTRY.filter(
    (lane) => lane.status === "planned",
  ).map((lane) => lane.title);
}