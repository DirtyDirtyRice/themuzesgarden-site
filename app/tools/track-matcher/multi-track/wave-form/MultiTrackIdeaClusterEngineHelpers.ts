import type {
  MultiTrackIdeaCluster,
  MultiTrackIdeaClusterActionPlan,
  MultiTrackIdeaClusterDecision,
  MultiTrackIdeaClusterEngineState,
  MultiTrackIdeaClusterEvidence,
  MultiTrackIdeaClusterReadiness,
  MultiTrackIdeaClusterStatus,
} from "./MultiTrackIdeaClusterEngineTypes";

export function getIdeaClusterReadinessLabel(readiness: MultiTrackIdeaClusterReadiness): string {
  if (readiness === "ready") return "Ready";
  if (readiness === "needs-review") return "Needs Review";
  if (readiness === "blocked") return "Blocked";
  return "Future";
}

export function getIdeaClusterStatusLabel(status: MultiTrackIdeaClusterStatus): string {
  if (status === "clustered") return "Clustered";
  if (status === "candidate") return "Candidate";
  if (status === "review") return "Review";
  if (status === "split") return "Split";
  if (status === "blocked") return "Blocked";
  return "Future";
}

export function getIdeaClusterDecisionLabel(decision: MultiTrackIdeaClusterDecision): string {
  if (decision === "promote") return "Promote";
  if (decision === "keep") return "Keep";
  if (decision === "review") return "Review";
  if (decision === "split") return "Split";
  if (decision === "merge") return "Merge";
  if (decision === "archive") return "Archive";
  return "Future";
}

export function getIdeaClusterWeightedEvidenceScore(
  evidence: MultiTrackIdeaClusterEvidence[],
): number {
  if (evidence.length === 0) return 0;

  const totalWeight = evidence.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) return 0;

  const weighted = evidence.reduce((sum, item) => {
    return sum + item.scorePercent * item.weight;
  }, 0);

  return Math.round(weighted / totalWeight);
}

export function getIdeaClusterAverageMemberConfidence(cluster: MultiTrackIdeaCluster): number {
  if (cluster.members.length === 0) return 0;

  const total = cluster.members.reduce(
    (sum, member) => sum + member.confidencePercent,
    0,
  );

  return Math.round(total / cluster.members.length);
}

export function getIdeaClusterAverageSimilarity(cluster: MultiTrackIdeaCluster): number {
  if (cluster.members.length === 0) return 0;

  const total = cluster.members.reduce(
    (sum, member) => sum + member.similarityPercent,
    0,
  );

  return Math.round(total / cluster.members.length);
}

export function getIdeaClusterAverageMutationDistance(cluster: MultiTrackIdeaCluster): number {
  if (cluster.members.length === 0) return 0;

  const total = cluster.members.reduce(
    (sum, member) => sum + member.mutationDistancePercent,
    0,
  );

  return Math.round(total / cluster.members.length);
}

export function getIdeaClusterScore(cluster: MultiTrackIdeaCluster): number {
  const evidence = getIdeaClusterWeightedEvidenceScore(cluster.evidence);
  const confidence = getIdeaClusterAverageMemberConfidence(cluster);
  const similarity = getIdeaClusterAverageSimilarity(cluster);
  const mutationPenalty = Math.min(getIdeaClusterAverageMutationDistance(cluster) * 0.2, 10);
  const reviewPenalty = cluster.risks.includes("needs-listening") ? 3 : 0;

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        evidence * 0.35 +
          confidence * 0.3 +
          similarity * 0.25 +
          cluster.clusterConfidencePercent * 0.1 -
          mutationPenalty -
          reviewPenalty,
      ),
    ),
  );
}

export function getIdeaClusterAction(cluster: MultiTrackIdeaCluster): string {
  const score = getIdeaClusterScore(cluster);

  if (cluster.decision === "promote" && score >= 88) {
    return "Promote to extraction and keeper bank";
  }

  if (cluster.decision === "review") {
    return "Listening review before promotion";
  }

  if (cluster.decision === "split") {
    return "Split weak members into separate cluster";
  }

  if (score >= 80) return "Keep as contender";
  return "Archive or wait";
}

export function getIdeaClusterActionPlanSummary(plan: MultiTrackIdeaClusterActionPlan): string {
  return `${getIdeaClusterDecisionLabel(plan.decision)} · ${plan.confidencePercent}% · ${
    plan.ready ? "ready" : "not ready"
  }`;
}

export function getIdeaClusterEngineMetrics(state: MultiTrackIdeaClusterEngineState): {
  clusterCount: number;
  memberCount: number;
  readyClusterCount: number;
  reviewClusterCount: number;
  promotedCount: number;
  averageClusterScore: number;
} {
  const memberCount = state.clusters.reduce(
    (sum, cluster) => sum + cluster.members.length,
    0,
  );

  const averageClusterScore =
    state.clusters.length === 0
      ? 0
      : Math.round(
          state.clusters.reduce((sum, cluster) => sum + getIdeaClusterScore(cluster), 0) /
            state.clusters.length,
        );

  return {
    clusterCount: state.clusters.length,
    memberCount,
    readyClusterCount: state.clusters.filter((cluster) => cluster.readiness === "ready")
      .length,
    reviewClusterCount: state.clusters.filter(
      (cluster) => cluster.readiness === "needs-review",
    ).length,
    promotedCount: state.clusters.filter((cluster) => cluster.decision === "promote")
      .length,
    averageClusterScore,
  };
}

export function getIdeaClusterDistanceLabel(state: MultiTrackIdeaClusterEngineState): string {
  const metrics = getIdeaClusterEngineMetrics(state);

  if (metrics.promotedCount > 0 && metrics.averageClusterScore >= 88) {
    return "Ready for keeper pipeline";
  }

  if (metrics.readyClusterCount > 0) return "Cluster promotion active";
  if (metrics.clusterCount > 0) return "Idea clustering active";
  return "Planning only";
}