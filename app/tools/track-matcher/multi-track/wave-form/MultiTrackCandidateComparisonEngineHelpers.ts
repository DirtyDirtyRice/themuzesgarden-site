// app/tools/track-matcher/multi-track/wave-form/MultiTrackCandidateComparisonEngineHelpers.ts

import type {
  MultiTrackCandidateComparison,
  MultiTrackCandidateComparisonReadiness,
  MultiTrackCandidateComparisonVerdict,
  MultiTrackCandidateComparisonWorkspace,
} from "./MultiTrackCandidateComparisonEngineTypes";

export function getCandidateComparisonReadinessLabel(
  readiness: MultiTrackCandidateComparisonReadiness
) {
  if (readiness === "ready") return "READY";
  if (readiness === "needs-review") return "NEEDS REVIEW";
  if (readiness === "blocked") return "BLOCKED";
  return "FUTURE";
}

export function getCandidateComparisonVerdictLabel(
  verdict: MultiTrackCandidateComparisonVerdict
) {
  if (verdict === "winner") return "WINNER";
  if (verdict === "contender") return "CONTENDER";
  if (verdict === "close-call") return "CLOSE CALL";
  return "NEEDS REVIEW";
}

export function getTopComparison(
  workspace: MultiTrackCandidateComparisonWorkspace
): MultiTrackCandidateComparison | null {
  return workspace.comparisons[0] ?? null;
}

export function getComparisonCount(
  workspace: MultiTrackCandidateComparisonWorkspace
) {
  return workspace.comparisons.length;
}

export function getAverageComparisonConfidence(
  workspace: MultiTrackCandidateComparisonWorkspace
) {
  if (!workspace.comparisons.length) return 0;

  const total = workspace.comparisons.reduce(
    (sum, comparison) => sum + comparison.confidence,
    0
  );

  return Math.round(total / workspace.comparisons.length);
}