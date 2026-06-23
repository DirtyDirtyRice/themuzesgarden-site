// app/tools/track-matcher/multi-track/wave-form/MultiTrackBuildDecisionEngineHelpers.ts

import type {
  MultiTrackBuildDecisionCandidate,
  MultiTrackBuildDecisionOutcome,
  MultiTrackBuildDecisionReadiness,
  MultiTrackBuildDecisionWorkspace,
} from "./MultiTrackBuildDecisionEngineTypes";

export function getBuildDecisionOutcomeLabel(
  outcome: MultiTrackBuildDecisionOutcome
) {
  if (outcome === "promote") return "PROMOTE";
  if (outcome === "hold") return "HOLD";
  if (outcome === "review") return "REVIEW";
  return "REJECT";
}

export function getBuildDecisionReadinessLabel(
  readiness: MultiTrackBuildDecisionReadiness
) {
  if (readiness === "ready") return "READY";
  if (readiness === "needs-review") return "NEEDS REVIEW";
  if (readiness === "blocked") return "BLOCKED";
  return "FUTURE";
}

export function getTopBuildDecision(
  workspace: MultiTrackBuildDecisionWorkspace
): MultiTrackBuildDecisionCandidate | null {
  return (
    [...workspace.decisions].sort(
      (a, b) => b.finalScore - a.finalScore
    )[0] ?? null
  );
}

export function getPromotionCount(
  workspace: MultiTrackBuildDecisionWorkspace
) {
  return workspace.decisions.filter(
    (decision) => decision.outcome === "promote"
  ).length;
}

export function getReviewCount(
  workspace: MultiTrackBuildDecisionWorkspace
) {
  return workspace.decisions.filter(
    (decision) => decision.outcome === "review"
  ).length;
}

export function getAverageBuildDecisionScore(
  workspace: MultiTrackBuildDecisionWorkspace
) {
  if (!workspace.decisions.length) return 0;

  const total = workspace.decisions.reduce(
    (sum, decision) => sum + decision.finalScore,
    0
  );

  return Math.round(total / workspace.decisions.length);
}