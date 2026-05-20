"use client";

import { TRACK_MATCHER_LANE_INTELLIGENCE_SIGNALS } from "./trackMatcherLaneIntelligenceSeed";
import type {
  TrackMatcherLaneIntelligenceDomain,
  TrackMatcherLaneIntelligencePriority,
  TrackMatcherLaneIntelligenceReadiness,
  TrackMatcherLaneIntelligenceSignal,
  TrackMatcherLaneIntelligenceSummary,
} from "./trackMatcherLaneIntelligenceTypes";

export function getTrackMatcherLaneIntelligenceSignalById(id: string) {
  return (
    TRACK_MATCHER_LANE_INTELLIGENCE_SIGNALS.find((signal) => signal.id === id) ??
    null
  );
}

export function getTrackMatcherLaneIntelligenceSignalsByDomain(
  domain: TrackMatcherLaneIntelligenceDomain,
) {
  return TRACK_MATCHER_LANE_INTELLIGENCE_SIGNALS.filter(
    (signal) => signal.domain === domain,
  );
}

export function getTrackMatcherLaneIntelligenceSignalsByPriority(
  priority: TrackMatcherLaneIntelligencePriority,
) {
  return TRACK_MATCHER_LANE_INTELLIGENCE_SIGNALS.filter(
    (signal) => signal.priority === priority,
  );
}

export function groupTrackMatcherLaneIntelligenceByLaneId() {
  const grouped: Record<string, TrackMatcherLaneIntelligenceSignal[]> = {};

  for (const signal of TRACK_MATCHER_LANE_INTELLIGENCE_SIGNALS) {
    grouped[signal.laneId] = grouped[signal.laneId] ?? [];
    grouped[signal.laneId].push(signal);
  }

  return grouped;
}

export function groupTrackMatcherLaneIntelligenceByReadiness() {
  const grouped: Record<
    TrackMatcherLaneIntelligenceReadiness,
    TrackMatcherLaneIntelligenceSignal[]
  > = {
    active: [],
    planned: [],
    blocked: [],
  };

  for (const signal of TRACK_MATCHER_LANE_INTELLIGENCE_SIGNALS) {
    grouped[signal.readiness].push(signal);
  }

  return grouped;
}

export function createTrackMatcherLaneIntelligenceSummary(): TrackMatcherLaneIntelligenceSummary {
  const activeSignals = TRACK_MATCHER_LANE_INTELLIGENCE_SIGNALS.filter(
    (signal) => signal.readiness === "active",
  ).length;

  const plannedSignals = TRACK_MATCHER_LANE_INTELLIGENCE_SIGNALS.filter(
    (signal) => signal.readiness === "planned",
  ).length;

  const blockedSignals = TRACK_MATCHER_LANE_INTELLIGENCE_SIGNALS.filter(
    (signal) => signal.readiness === "blocked",
  ).length;

  const coreSignals = TRACK_MATCHER_LANE_INTELLIGENCE_SIGNALS.filter(
    (signal) => signal.priority === "core",
  ).length;

  const futureSignals = TRACK_MATCHER_LANE_INTELLIGENCE_SIGNALS.filter(
    (signal) => signal.priority === "future",
  ).length;

  return {
    totalSignals: TRACK_MATCHER_LANE_INTELLIGENCE_SIGNALS.length,
    activeSignals,
    plannedSignals,
    blockedSignals,
    coreSignals,
    futureSignals,
  };
}

export function getTrackMatcherLaneIntelligenceLaneIds() {
  return Array.from(
    new Set(TRACK_MATCHER_LANE_INTELLIGENCE_SIGNALS.map((signal) => signal.laneId)),
  );
}

export function hasTrackMatcherLaneActiveIntelligence(laneId: string) {
  return TRACK_MATCHER_LANE_INTELLIGENCE_SIGNALS.some(
    (signal) => signal.laneId === laneId && signal.readiness === "active",
  );
}