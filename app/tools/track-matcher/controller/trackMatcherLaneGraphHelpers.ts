"use client";

import {
  TRACK_MATCHER_LANE_GRAPH_EDGES,
  TRACK_MATCHER_LANE_GRAPH_NODES,
} from "./trackMatcherLaneGraphSeed";
import type {
  TrackMatcherLaneGraphEdge,
  TrackMatcherLaneGraphEdgeKind,
  TrackMatcherLaneGraphNode,
  TrackMatcherLaneGraphNodeKind,
  TrackMatcherLaneGraphSummary,
} from "./trackMatcherLaneGraphTypes";

export function getTrackMatcherLaneGraphNodeById(id: string) {
  return TRACK_MATCHER_LANE_GRAPH_NODES.find((node) => node.id === id) ?? null;
}

export function getTrackMatcherLaneGraphEdgeById(id: string) {
  return TRACK_MATCHER_LANE_GRAPH_EDGES.find((edge) => edge.id === id) ?? null;
}

export function getTrackMatcherLaneGraphNodesByKind(
  kind: TrackMatcherLaneGraphNodeKind,
) {
  return TRACK_MATCHER_LANE_GRAPH_NODES.filter((node) => node.kind === kind);
}

export function getTrackMatcherLaneGraphEdgesByKind(
  kind: TrackMatcherLaneGraphEdgeKind,
) {
  return TRACK_MATCHER_LANE_GRAPH_EDGES.filter((edge) => edge.kind === kind);
}

export function getTrackMatcherLaneGraphActiveNodes() {
  return TRACK_MATCHER_LANE_GRAPH_NODES.filter((node) => node.active);
}

export function getTrackMatcherLaneGraphPlannedNodes() {
  return TRACK_MATCHER_LANE_GRAPH_NODES.filter((node) => !node.active);
}

export function getTrackMatcherLaneGraphEdgesForNode(nodeId: string) {
  return TRACK_MATCHER_LANE_GRAPH_EDGES.filter(
    (edge) => edge.fromNodeId === nodeId || edge.toNodeId === nodeId,
  );
}

export function getTrackMatcherLaneGraphEdgesForLane(laneId: string) {
  const node = TRACK_MATCHER_LANE_GRAPH_NODES.find(
    (item) => item.laneId === laneId,
  );

  if (!node) {
    return [];
  }

  return getTrackMatcherLaneGraphEdgesForNode(node.id);
}

export function groupTrackMatcherLaneGraphNodesByKind() {
  const grouped: Record<
    TrackMatcherLaneGraphNodeKind,
    TrackMatcherLaneGraphNode[]
  > = {
    source: [],
    comparison: [],
    reference: [],
    stem: [],
    generated: [],
    analysis: [],
  };

  for (const node of TRACK_MATCHER_LANE_GRAPH_NODES) {
    grouped[node.kind].push(node);
  }

  return grouped;
}

export function groupTrackMatcherLaneGraphEdgesByKind() {
  const grouped: Partial<
    Record<TrackMatcherLaneGraphEdgeKind, TrackMatcherLaneGraphEdge[]>
  > = {};

  for (const edge of TRACK_MATCHER_LANE_GRAPH_EDGES) {
    grouped[edge.kind] = grouped[edge.kind] ?? [];
    grouped[edge.kind]?.push(edge);
  }

  return grouped;
}

export function createTrackMatcherLaneGraphSummary(): TrackMatcherLaneGraphSummary {
  const activeNodeCount = TRACK_MATCHER_LANE_GRAPH_NODES.filter(
    (node) => node.active,
  ).length;

  const plannedNodeCount = TRACK_MATCHER_LANE_GRAPH_NODES.length - activeNodeCount;

  const strongEdgeCount = TRACK_MATCHER_LANE_GRAPH_EDGES.filter(
    (edge) => edge.strength === "strong",
  ).length;

  const plannedEdgeCount = TRACK_MATCHER_LANE_GRAPH_EDGES.filter(
    (edge) => edge.strength === "planned",
  ).length;

  return {
    nodeCount: TRACK_MATCHER_LANE_GRAPH_NODES.length,
    edgeCount: TRACK_MATCHER_LANE_GRAPH_EDGES.length,
    activeNodeCount,
    plannedNodeCount,
    strongEdgeCount,
    plannedEdgeCount,
  };
}