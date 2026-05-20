"use client";

import type {
  TrackMatcherLaneGraphEdge,
  TrackMatcherLaneGraphNode,
} from "./trackMatcherLaneGraphTypes";

export const TRACK_MATCHER_LANE_GRAPH_NODES: TrackMatcherLaneGraphNode[] = [
  {
    id: "node-deck-a",
    laneId: "deck-a",
    title: "Deck A Source",
    kind: "source",
    description: "Primary uploaded audio source used by the current workflow.",
    active: true,
  },
  {
    id: "node-deck-b",
    laneId: "deck-b",
    title: "Deck B Comparison",
    kind: "comparison",
    description: "Secondary uploaded audio source used for comparison and matching.",
    active: true,
  },
  {
    id: "node-reference-song",
    laneId: "reference-song",
    title: "Reference Song",
    kind: "reference",
    description: "Future reference lane for style, influence, and lineage matching.",
    active: false,
  },
  {
    id: "node-stem-bus",
    laneId: "stem-bus",
    title: "Stem Bus",
    kind: "stem",
    description: "Future lane group for vocals, drums, bass, harmony, and texture.",
    active: false,
  },
  {
    id: "node-generated-candidate",
    laneId: "generated-candidate",
    title: "Generated Candidate",
    kind: "generated",
    description: "Future generated-audio lane for review and regeneration decisions.",
    active: false,
  },
];

export const TRACK_MATCHER_LANE_GRAPH_EDGES: TrackMatcherLaneGraphEdge[] = [
  {
    id: "edge-deck-a-deck-b-audio",
    fromNodeId: "node-deck-a",
    toNodeId: "node-deck-b",
    kind: "audio-match",
    strength: "strong",
    title: "Deck A ↔ Deck B Audio Match",
    description: "Connects the two active uploaded audio lanes.",
  },
  {
    id: "edge-deck-a-deck-b-tempo",
    fromNodeId: "node-deck-a",
    toNodeId: "node-deck-b",
    kind: "tempo-match",
    strength: "strong",
    title: "Tempo Comparison",
    description: "Tracks tempo relationship between the active source and comparison lanes.",
  },
  {
    id: "edge-deck-a-deck-b-key",
    fromNodeId: "node-deck-a",
    toNodeId: "node-deck-b",
    kind: "key-match",
    strength: "medium",
    title: "Key Comparison",
    description: "Tracks harmonic relationship between the active source and comparison lanes.",
  },
  {
    id: "edge-reference-lineage",
    fromNodeId: "node-reference-song",
    toNodeId: "node-generated-candidate",
    kind: "melody-lineage",
    strength: "planned",
    title: "Reference Melody Lineage",
    description: "Future edge for comparing generated melody against reference influence.",
  },
  {
    id: "edge-stem-source",
    fromNodeId: "node-deck-a",
    toNodeId: "node-stem-bus",
    kind: "stem-source",
    strength: "planned",
    title: "Stem Source Routing",
    description: "Future edge for linking separated stems back to original audio.",
  },
  {
    id: "edge-generated-review",
    fromNodeId: "node-deck-a",
    toNodeId: "node-generated-candidate",
    kind: "generation-review",
    strength: "planned",
    title: "Generated Candidate Review",
    description: "Future edge for comparing generated output against source intent.",
  },
];

export function getTrackMatcherLaneGraphNodes() {
  return TRACK_MATCHER_LANE_GRAPH_NODES;
}

export function getTrackMatcherLaneGraphEdges() {
  return TRACK_MATCHER_LANE_GRAPH_EDGES;
}