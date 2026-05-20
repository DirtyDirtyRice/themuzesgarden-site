"use client";

export type TrackMatcherLaneGraphNodeKind =
  | "source"
  | "comparison"
  | "reference"
  | "stem"
  | "generated"
  | "analysis";

export type TrackMatcherLaneGraphEdgeKind =
  | "audio-match"
  | "tempo-match"
  | "key-match"
  | "melody-lineage"
  | "stem-source"
  | "generation-review";

export type TrackMatcherLaneGraphStrength =
  | "strong"
  | "medium"
  | "weak"
  | "planned";

export type TrackMatcherLaneGraphNode = {
  id: string;
  laneId: string;
  title: string;
  kind: TrackMatcherLaneGraphNodeKind;
  description: string;
  active: boolean;
};

export type TrackMatcherLaneGraphEdge = {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  kind: TrackMatcherLaneGraphEdgeKind;
  strength: TrackMatcherLaneGraphStrength;
  title: string;
  description: string;
};

export type TrackMatcherLaneGraphSummary = {
  nodeCount: number;
  edgeCount: number;
  activeNodeCount: number;
  plannedNodeCount: number;
  strongEdgeCount: number;
  plannedEdgeCount: number;
};

export function getTrackMatcherLaneGraphNodeKindLabel(
  kind: TrackMatcherLaneGraphNodeKind,
) {
  switch (kind) {
    case "source":
      return "Source";
    case "comparison":
      return "Comparison";
    case "reference":
      return "Reference";
    case "stem":
      return "Stem";
    case "generated":
      return "Generated";
    case "analysis":
      return "Analysis";
    default:
      return "Unknown";
  }
}

export function getTrackMatcherLaneGraphEdgeKindLabel(
  kind: TrackMatcherLaneGraphEdgeKind,
) {
  switch (kind) {
    case "audio-match":
      return "Audio Match";
    case "tempo-match":
      return "Tempo Match";
    case "key-match":
      return "Key Match";
    case "melody-lineage":
      return "Melody Lineage";
    case "stem-source":
      return "Stem Source";
    case "generation-review":
      return "Generation Review";
    default:
      return "Unknown";
  }
}

export function getTrackMatcherLaneGraphStrengthLabel(
  strength: TrackMatcherLaneGraphStrength,
) {
  switch (strength) {
    case "strong":
      return "Strong";
    case "medium":
      return "Medium";
    case "weak":
      return "Weak";
    case "planned":
      return "Planned";
    default:
      return "Unknown";
  }
}