import type {
  MultiTrackLineageChain,
  MultiTrackLineageConfidenceLevel,
  MultiTrackLineageEvidenceSource,
  MultiTrackLineageNode,
  MultiTrackLineageReadinessStatus,
  MultiTrackLineageRelationship,
  MultiTrackLineageRelationshipType,
  MultiTrackLineageReviewLane,
  MultiTrackLineageRisk,
  MultiTrackLineageSourceType,
  MultiTrackLineageWorkspaceState,
} from "./MultiTrackLineageIntelligenceTypes";

export function getMultiTrackLineageStatusLabel(
  status: MultiTrackLineageReadinessStatus,
): string {
  if (status === "ready") return "Ready";
  if (status === "needs-review") return "Needs Review";
  if (status === "blocked") return "Blocked";
  return "Future";
}

export function getMultiTrackLineageStatusClass(
  status: MultiTrackLineageReadinessStatus,
): string {
  if (status === "ready") return "border-white/40 bg-white/10 text-white";
  if (status === "needs-review") return "border-white/30 bg-black text-white/80";
  if (status === "blocked") return "border-white/20 bg-black text-white/70";
  return "border-white/10 bg-black text-white/60";
}

export function getMultiTrackLineageSourceTypeLabel(
  sourceType: MultiTrackLineageSourceType,
): string {
  if (sourceType === "original-phone-recording") return "Original Phone Recording";
  if (sourceType === "demo") return "Demo";
  if (sourceType === "suno-generation") return "Suno Generation";
  if (sourceType === "stem-export") return "Stem Export";
  if (sourceType === "master-export") return "Master Export";
  if (sourceType === "reference-track") return "Reference Track";
  if (sourceType === "hybrid-output") return "Hybrid Output";
  if (sourceType === "manual-note") return "Manual Note";
  return "Future AI";
}

export function getMultiTrackLineageRelationshipTypeLabel(
  relationshipType: MultiTrackLineageRelationshipType,
): string {
  if (relationshipType === "parent") return "Parent";
  if (relationshipType === "child") return "Child";
  if (relationshipType === "sibling") return "Sibling";
  if (relationshipType === "reference") return "Reference";
  if (relationshipType === "derived-from") return "Derived From";
  if (relationshipType === "inspired-by") return "Inspired By";
  if (relationshipType === "same-session") return "Same Session";
  if (relationshipType === "same-song-family") return "Same Song Family";
  if (relationshipType === "unknown") return "Unknown";
  return "Future";
}

export function getMultiTrackLineageEvidenceSourceLabel(
  evidenceSource: MultiTrackLineageEvidenceSource,
): string {
  if (evidenceSource === "filename") return "Filename";
  if (evidenceSource === "metadata") return "Metadata";
  if (evidenceSource === "library-link") return "Library Link";
  if (evidenceSource === "project-link") return "Project Link";
  if (evidenceSource === "stem-ownership") return "Stem Ownership";
  if (evidenceSource === "comparison") return "Comparison";
  if (evidenceSource === "confidence") return "Confidence";
  if (evidenceSource === "manual-review") return "Manual Review";
  return "Future AI";
}

export function getMultiTrackLineageConfidenceLabel(
  confidenceLevel: MultiTrackLineageConfidenceLevel,
): string {
  if (confidenceLevel === "verified") return "Verified";
  if (confidenceLevel === "strong") return "Strong";
  if (confidenceLevel === "moderate") return "Moderate";
  if (confidenceLevel === "weak") return "Weak";
  if (confidenceLevel === "unknown") return "Unknown";
  return "Future";
}

export function getMultiTrackLineageRiskLabel(
  risk: MultiTrackLineageRisk,
): string {
  if (risk === "missing-original") return "Missing Original";
  if (risk === "missing-generation-link") return "Missing Generation Link";
  if (risk === "missing-stem-map") return "Missing Stem Map";
  if (risk === "filename-only") return "Filename Only";
  if (risk === "weak-confidence") return "Weak Confidence";
  if (risk === "unverified-claim") return "Unverified Claim";
  if (risk === "needs-human-review") return "Needs Human Review";
  return "Future Only";
}

export function getMultiTrackLineageNodeById(
  nodes: MultiTrackLineageNode[],
  nodeId: string,
): MultiTrackLineageNode | undefined {
  return nodes.find((node) => node.id === nodeId);
}

export function getMultiTrackLineageRelationshipById(
  relationships: MultiTrackLineageRelationship[],
  relationshipId: string,
): MultiTrackLineageRelationship | undefined {
  return relationships.find((relationship) => relationship.id === relationshipId);
}

export function getMultiTrackLineageChainNodes(
  chain: MultiTrackLineageChain,
  nodes: MultiTrackLineageNode[],
): MultiTrackLineageNode[] {
  return chain.nodeIds
    .map((nodeId) => getMultiTrackLineageNodeById(nodes, nodeId))
    .filter((node): node is MultiTrackLineageNode => Boolean(node));
}

export function getMultiTrackLineageChainRelationships(
  chain: MultiTrackLineageChain,
  relationships: MultiTrackLineageRelationship[],
): MultiTrackLineageRelationship[] {
  return chain.relationshipIds
    .map((relationshipId) =>
      getMultiTrackLineageRelationshipById(relationships, relationshipId),
    )
    .filter((relationship): relationship is MultiTrackLineageRelationship =>
      Boolean(relationship),
    );
}

export function getMultiTrackLineageReviewLaneNodes(
  lane: MultiTrackLineageReviewLane,
  nodes: MultiTrackLineageNode[],
): MultiTrackLineageNode[] {
  return lane.nodeIds
    .map((nodeId) => getMultiTrackLineageNodeById(nodes, nodeId))
    .filter((node): node is MultiTrackLineageNode => Boolean(node));
}

export function getMultiTrackLineageReviewLaneRelationships(
  lane: MultiTrackLineageReviewLane,
  relationships: MultiTrackLineageRelationship[],
): MultiTrackLineageRelationship[] {
  return lane.relationshipIds
    .map((relationshipId) =>
      getMultiTrackLineageRelationshipById(relationships, relationshipId),
    )
    .filter((relationship): relationship is MultiTrackLineageRelationship =>
      Boolean(relationship),
    );
}

export function getMultiTrackLineageReadyNodeCount(
  nodes: MultiTrackLineageNode[],
): number {
  return nodes.filter((node) => node.readinessStatus === "ready").length;
}

export function getMultiTrackLineageReviewNodeCount(
  nodes: MultiTrackLineageNode[],
): number {
  return nodes.filter((node) => node.readinessStatus === "needs-review").length;
}

export function getMultiTrackLineageReadyRelationshipCount(
  relationships: MultiTrackLineageRelationship[],
): number {
  return relationships.filter(
    (relationship) => relationship.readinessStatus === "ready",
  ).length;
}

export function getMultiTrackLineageFutureCount(
  workspace: MultiTrackLineageWorkspaceState,
): number {
  const futureNodes = workspace.nodes.filter(
    (node) => node.readinessStatus === "future",
  ).length;
  const futureRelationships = workspace.relationships.filter(
    (relationship) => relationship.readinessStatus === "future",
  ).length;
  const futureChains = workspace.chains.filter(
    (chain) => chain.readinessStatus === "future",
  ).length;

  return futureNodes + futureRelationships + futureChains;
}

export function getMultiTrackLineageRiskSummary(
  risks: MultiTrackLineageRisk[],
): string {
  if (risks.length === 0) return "No risks listed.";
  return risks.map(getMultiTrackLineageRiskLabel).join(", ");
}

export function getMultiTrackLineageRelationshipNodeLabel(
  relationship: MultiTrackLineageRelationship,
  nodes: MultiTrackLineageNode[],
): string {
  const fromNode = getMultiTrackLineageNodeById(nodes, relationship.fromNodeId);
  const toNode = getMultiTrackLineageNodeById(nodes, relationship.toNodeId);

  return `${fromNode?.title ?? "Unknown Source"} → ${
    toNode?.title ?? "Unknown Target"
  }`;
}

export function getMultiTrackLineageWorkspaceSummary(
  workspace: MultiTrackLineageWorkspaceState,
): string {
  const readyNodes = getMultiTrackLineageReadyNodeCount(workspace.nodes);
  const reviewNodes = getMultiTrackLineageReviewNodeCount(workspace.nodes);
  const readyRelationships = getMultiTrackLineageReadyRelationshipCount(
    workspace.relationships,
  );
  const futureItems = getMultiTrackLineageFutureCount(workspace);

  return `${readyNodes} ready nodes, ${reviewNodes} review nodes, ${readyRelationships} ready relationships, and ${futureItems} future items.`;
}