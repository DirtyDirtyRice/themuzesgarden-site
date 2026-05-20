"use client";

import {
  createTrackMatcherLaneGraphSummary,
  getTrackMatcherLaneGraphActiveNodes,
  getTrackMatcherLaneGraphEdgesForLane,
  getTrackMatcherLaneGraphPlannedNodes,
} from "./trackMatcherLaneGraphHelpers";
import {
  getTrackMatcherLaneGraphEdgeKindLabel,
  getTrackMatcherLaneGraphStrengthLabel,
  type TrackMatcherLaneGraphEdge,
  type TrackMatcherLaneGraphNode,
} from "./trackMatcherLaneGraphTypes";

export function describeTrackMatcherLaneGraphNode(
  node: TrackMatcherLaneGraphNode,
) {
  return `${node.title}: ${node.description}`;
}

export function describeTrackMatcherLaneGraphEdge(
  edge: TrackMatcherLaneGraphEdge,
) {
  const kindLabel = getTrackMatcherLaneGraphEdgeKindLabel(edge.kind);
  const strengthLabel = getTrackMatcherLaneGraphStrengthLabel(edge.strength);

  return `${edge.title} is a ${strengthLabel.toLowerCase()} ${kindLabel.toLowerCase()} edge.`;
}

export function describeTrackMatcherLaneGraphSystem() {
  const summary = createTrackMatcherLaneGraphSummary();

  return [
    `${summary.nodeCount} lane graph nodes are mapped.`,
    `${summary.edgeCount} lane graph edges are mapped.`,
    `${summary.activeNodeCount} nodes are active today.`,
    `${summary.plannedNodeCount} nodes are reserved for future lanes.`,
    `${summary.strongEdgeCount} edges are strong active relationships.`,
    `${summary.plannedEdgeCount} edges are planned future relationships.`,
  ].join(" ");
}

export function describeTrackMatcherLaneGraphForLane(laneId: string) {
  const edges = getTrackMatcherLaneGraphEdgesForLane(laneId);

  if (edges.length === 0) {
    return "No graph edges are mapped for this lane yet.";
  }

  return `${edges.length} graph edge${edges.length === 1 ? "" : "s"} mapped for this lane.`;
}

export function getTrackMatcherLaneGraphNextFocus() {
  const activeNodes = getTrackMatcherLaneGraphActiveNodes();
  const plannedNodes = getTrackMatcherLaneGraphPlannedNodes();

  if (activeNodes.length < 2) {
    return "Protect the two active Deck lanes before adding more graph branches.";
  }

  if (plannedNodes.length > activeNodes.length) {
    return "Start converting planned graph nodes into visible registry-driven UI sections.";
  }

  return "Begin wiring graph edges into analysis and relationship panels.";
}