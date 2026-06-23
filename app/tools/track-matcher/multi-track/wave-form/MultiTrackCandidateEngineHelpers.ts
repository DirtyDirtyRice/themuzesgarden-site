import type {
  MultiTrackCandidate,
  MultiTrackCandidateReadiness,
  MultiTrackCandidateSource,
  MultiTrackCandidateTier,
  MultiTrackCandidateWorkspace,
} from "./MultiTrackCandidateEngineTypes";

export function getMultiTrackCandidateReadinessLabel(
  readiness: MultiTrackCandidateReadiness
) {
  if (readiness === "ready") return "READY";
  if (readiness === "needs-review") return "NEEDS REVIEW";
  if (readiness === "blocked") return "BLOCKED";
  return "FUTURE";
}

export function getMultiTrackCandidateTierLabel(tier: MultiTrackCandidateTier) {
  if (tier === "elite") return "ELITE";
  if (tier === "strong") return "STRONG";
  if (tier === "supporting") return "SUPPORTING";
  return "EXPERIMENTAL";
}

export function getMultiTrackCandidateSourceLabel(
  source: MultiTrackCandidateSource
) {
  if (source === "recurring-riff") return "RECURRING RIFF";
  if (source === "riff-frequency") return "RIFF FREQUENCY";
  if (source === "strongest-idea") return "STRONGEST IDEA";
  if (source === "arrangement") return "ARRANGEMENT";
  if (source === "hybrid") return "HYBRID";
  if (source === "keeper-bank") return "KEEPER BANK";
  return "MANUAL";
}

export function getMultiTrackCandidateTopCandidate(
  workspace: MultiTrackCandidateWorkspace
): MultiTrackCandidate | null {
  return (
    [...workspace.candidates].sort(
      (firstCandidate, secondCandidate) =>
        secondCandidate.candidateScore - firstCandidate.candidateScore
    )[0] || null
  );
}

export function getMultiTrackCandidateReadyCount(
  workspace: MultiTrackCandidateWorkspace
) {
  return workspace.candidates.filter(
    (candidate) => candidate.readiness === "ready"
  ).length;
}

export function getMultiTrackCandidateReviewCount(
  workspace: MultiTrackCandidateWorkspace
) {
  return workspace.candidates.filter(
    (candidate) => candidate.readiness === "needs-review"
  ).length;
}

export function getMultiTrackCandidateEliteCount(
  workspace: MultiTrackCandidateWorkspace
) {
  return workspace.candidates.filter((candidate) => candidate.tier === "elite")
    .length;
}

export function getMultiTrackCandidateAverageScore(
  workspace: MultiTrackCandidateWorkspace
) {
  if (workspace.candidates.length === 0) return 0;

  const total = workspace.candidates.reduce(
    (sum, candidate) => sum + candidate.candidateScore,
    0
  );

  return Math.round(total / workspace.candidates.length);
}