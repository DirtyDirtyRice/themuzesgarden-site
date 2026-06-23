// app/tools/track-matcher/multi-track/wave-form/MultiTrackCandidateRankingEngineHelpers.ts

import type {
  MultiTrackCandidateRankingEntry,
  MultiTrackCandidateRankingReadiness,
  MultiTrackCandidateRankingTier,
  MultiTrackCandidateRankingWorkspace,
} from "./MultiTrackCandidateRankingEngineTypes";

export function getCandidateRankingReadinessLabel(
  readiness: MultiTrackCandidateRankingReadiness
) {
  if (readiness === "ready") return "READY";
  if (readiness === "needs-review") return "NEEDS REVIEW";
  if (readiness === "blocked") return "BLOCKED";
  return "FUTURE";
}

export function getCandidateRankingTierLabel(
  tier: MultiTrackCandidateRankingTier
) {
  if (tier === "elite") return "ELITE";
  if (tier === "strong") return "STRONG";
  if (tier === "supporting") return "SUPPORTING";
  return "EXPERIMENTAL";
}

export function getTopRankedCandidate(
  workspace: MultiTrackCandidateRankingWorkspace
): MultiTrackCandidateRankingEntry | null {
  return workspace.rankings[0] ?? null;
}

export function getPromotionReadyCount(
  workspace: MultiTrackCandidateRankingWorkspace
) {
  return workspace.rankings.filter((entry) => entry.promotionReady).length;
}

export function getAverageRankingScore(
  workspace: MultiTrackCandidateRankingWorkspace
) {
  if (!workspace.rankings.length) return 0;

  const total = workspace.rankings.reduce(
    (sum, entry) => sum + entry.score,
    0
  );

  return Math.round(total / workspace.rankings.length);
}

export function getEliteRankingCount(
  workspace: MultiTrackCandidateRankingWorkspace
) {
  return workspace.rankings.filter((entry) => entry.tier === "elite").length;
}