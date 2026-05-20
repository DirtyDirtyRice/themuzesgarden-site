"use client";

export type TrackMatcherLaneIntelligenceDomain =
  | "tempo"
  | "key"
  | "melody"
  | "harmony"
  | "stems"
  | "lineage"
  | "generation"
  | "pronunciation";

export type TrackMatcherLaneIntelligencePriority =
  | "core"
  | "important"
  | "future";

export type TrackMatcherLaneIntelligenceReadiness =
  | "active"
  | "planned"
  | "blocked";

export type TrackMatcherLaneIntelligenceSignal = {
  id: string;
  laneId: string;
  domain: TrackMatcherLaneIntelligenceDomain;
  priority: TrackMatcherLaneIntelligencePriority;
  readiness: TrackMatcherLaneIntelligenceReadiness;
  title: string;
  description: string;
  futureUse: string;
};

export type TrackMatcherLaneIntelligenceSummary = {
  totalSignals: number;
  activeSignals: number;
  plannedSignals: number;
  blockedSignals: number;
  coreSignals: number;
  futureSignals: number;
};

export function getTrackMatcherLaneIntelligenceDomainLabel(
  domain: TrackMatcherLaneIntelligenceDomain,
) {
  switch (domain) {
    case "tempo":
      return "Tempo";
    case "key":
      return "Key";
    case "melody":
      return "Melody";
    case "harmony":
      return "Harmony";
    case "stems":
      return "Stems";
    case "lineage":
      return "Lineage";
    case "generation":
      return "Generation";
    case "pronunciation":
      return "Pronunciation";
    default:
      return "Unknown";
  }
}

export function getTrackMatcherLaneIntelligencePriorityLabel(
  priority: TrackMatcherLaneIntelligencePriority,
) {
  switch (priority) {
    case "core":
      return "Core";
    case "important":
      return "Important";
    case "future":
      return "Future";
    default:
      return "Unknown";
  }
}

export function getTrackMatcherLaneIntelligenceReadinessLabel(
  readiness: TrackMatcherLaneIntelligenceReadiness,
) {
  switch (readiness) {
    case "active":
      return "Active";
    case "planned":
      return "Planned";
    case "blocked":
      return "Blocked";
    default:
      return "Unknown";
  }
}