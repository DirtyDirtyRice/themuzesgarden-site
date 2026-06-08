import type {
  MultiTrackSimilarityCandidate,
  MultiTrackSimilarityDecision,
  MultiTrackSimilarityFamilySummary,
  MultiTrackSimilarityFeatureScore,
  MultiTrackSimilarityStatus,
  MultiTrackSimilarityWorkspaceState,
} from "./MultiTrackSimilarityTypes";

export function getMultiTrackSimilarityStatusLabel(
  status: MultiTrackSimilarityStatus,
): string {
  if (status === "match") return "Monster Match";
  if (status === "strong") return "Strong";
  if (status === "review") return "Review";
  if (status === "weak") return "Weak";
  if (status === "blocked") return "Blocked";
  return "Future";
}

export function getMultiTrackSimilarityDecisionLabel(
  decision: MultiTrackSimilarityDecision,
): string {
  if (decision === "same-family") return "Same Family";
  if (decision === "probable-family") return "Probable Family";
  if (decision === "needs-listening") return "Needs Listening";
  if (decision === "different-family") return "Different Family";
  if (decision === "blocked-by-normalization") return "Blocked By Normalization";
  return "Future Detection";
}

export function getMultiTrackSimilarityAcceptedCandidates(
  candidates: MultiTrackSimilarityCandidate[],
): MultiTrackSimilarityCandidate[] {
  return candidates.filter(
    (candidate) =>
      candidate.decision === "same-family" || candidate.decision === "probable-family",
  );
}

export function getMultiTrackSimilarityReviewCandidates(
  candidates: MultiTrackSimilarityCandidate[],
): MultiTrackSimilarityCandidate[] {
  return candidates.filter((candidate) => candidate.decision === "needs-listening");
}

export function getMultiTrackSimilarityAverageScore(
  candidates: MultiTrackSimilarityCandidate[],
): number {
  if (candidates.length === 0) return 0;

  const total = candidates.reduce(
    (sum, candidate) => sum + candidate.totalSimilarityPercent,
    0,
  );

  return Math.round(total / candidates.length);
}

export function getMultiTrackSimilarityAverageConfidence(
  candidates: MultiTrackSimilarityCandidate[],
): number {
  if (candidates.length === 0) return 0;

  const total = candidates.reduce(
    (sum, candidate) => sum + candidate.confidencePercent,
    0,
  );

  return Math.round(total / candidates.length);
}

export function getMultiTrackSimilarityMaxTimingDrift(
  candidates: MultiTrackSimilarityCandidate[],
): number {
  if (candidates.length === 0) return 0;

  const drift = Math.max(
    ...candidates.map((candidate) => Math.abs(candidate.timingDriftSeconds)),
  );

  return Number(drift.toFixed(2));
}

export function getMultiTrackSimilarityWeightedFeatureScore(
  scores: MultiTrackSimilarityFeatureScore[],
): number {
  if (scores.length === 0) return 0;

  const totalWeight = scores.reduce((sum, score) => sum + score.weight, 0);
  if (totalWeight === 0) return 0;

  const weighted = scores.reduce(
    (sum, score) => sum + score.scorePercent * score.weight,
    0,
  );

  return Math.round(weighted / totalWeight);
}

export function getMultiTrackSimilarityCandidateSafetyLabel(
  candidate: MultiTrackSimilarityCandidate,
): string {
  if (candidate.totalSimilarityPercent >= 95 && candidate.confidencePercent >= 90) {
    return "Safe Monster Match";
  }

  if (candidate.totalSimilarityPercent >= 90) {
    return "Safe Same-Family Candidate";
  }

  if (candidate.totalSimilarityPercent >= 85) {
    return "Listening Review Required";
  }

  return "Do Not Auto Group";
}

export function getMultiTrackSimilarityFamilySummaries(
  candidates: MultiTrackSimilarityCandidate[],
): MultiTrackSimilarityFamilySummary[] {
  const groupIds = Array.from(new Set(candidates.map((candidate) => candidate.riffGroupId)));

  return groupIds.map((riffGroupId) => {
    const familyCandidates = candidates.filter(
      (candidate) => candidate.riffGroupId === riffGroupId,
    );

    const first = familyCandidates[0];

    return {
      id: `summary-${riffGroupId}`,
      riffGroupId,
      riffGroupLabel: first?.riffGroupLabel ?? riffGroupId,
      color: first?.color ?? "white",
      candidateCount: familyCandidates.length,
      acceptedCount: getMultiTrackSimilarityAcceptedCandidates(familyCandidates).length,
      reviewCount: getMultiTrackSimilarityReviewCandidates(familyCandidates).length,
      averageSimilarityPercent: getMultiTrackSimilarityAverageScore(familyCandidates),
      averageConfidencePercent: getMultiTrackSimilarityAverageConfidence(familyCandidates),
      maxTimingDriftSeconds: getMultiTrackSimilarityMaxTimingDrift(familyCandidates),
      detail:
        "Family summary groups similarity candidates by riff color and musical memory.",
    };
  });
}

export function getMultiTrackSimilarityWorkspaceReadinessPercent(
  state: MultiTrackSimilarityWorkspaceState,
): number {
  if (state.candidates.length === 0) return 0;

  const accepted = getMultiTrackSimilarityAcceptedCandidates(state.candidates).length;
  return Math.round((accepted / state.candidates.length) * 100);
}

export function getMultiTrackSimilarityWorkspaceReviewPercent(
  state: MultiTrackSimilarityWorkspaceState,
): number {
  if (state.candidates.length === 0) return 0;

  const review = getMultiTrackSimilarityReviewCandidates(state.candidates).length;
  return Math.round((review / state.candidates.length) * 100);
}

export function getMultiTrackSimilarityEngineDistanceLabel(
  state: MultiTrackSimilarityWorkspaceState,
): string {
  const readiness = getMultiTrackSimilarityWorkspaceReadinessPercent(state);

  if (readiness >= 90) return "Ready for extraction decisions";
  if (readiness >= 60) return "Manual similarity engine";
  if (readiness >= 30) return "Review-heavy similarity engine";
  return "Seed planning only";
}