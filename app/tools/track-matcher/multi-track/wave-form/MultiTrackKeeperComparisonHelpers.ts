import type {
  MultiTrackKeeperComparisonBand,
  MultiTrackKeeperComparisonDecision,
  MultiTrackKeeperComparisonPair,
  MultiTrackKeeperComparisonReadinessStatus,
  MultiTrackKeeperComparisonRole,
  MultiTrackKeeperComparisonSignalKind,
  MultiTrackKeeperComparisonVersion,
  MultiTrackKeeperComparisonWorkspaceState,
} from "./MultiTrackKeeperComparisonTypes";

export function getMultiTrackKeeperComparisonReadinessLabel(
  status: MultiTrackKeeperComparisonReadinessStatus,
): string {
  if (status === "ready") return "Ready";
  if (status === "needs-review") return "Needs Review";
  if (status === "blocked") return "Blocked";
  return "Future";
}

export function getMultiTrackKeeperComparisonDecisionLabel(
  decision: MultiTrackKeeperComparisonDecision,
): string {
  if (decision === "promote") return "Promote";
  if (decision === "review") return "Review";
  if (decision === "archive") return "Archive";
  if (decision === "extract") return "Extract";
  if (decision === "duplicate") return "Duplicate";
  return "Hold";
}

export function getMultiTrackKeeperComparisonRoleLabel(role: MultiTrackKeeperComparisonRole): string {
  if (role === "original") return "Original";
  if (role === "closest-match") return "Closest Match";
  if (role === "strongest-hook") return "Strongest Hook";
  if (role === "best-mutation") return "Best Mutation";
  if (role === "arrangement-candidate") return "Arrangement Candidate";
  if (role === "archive-candidate") return "Archive Candidate";
  return "Review Candidate";
}

export function getMultiTrackKeeperComparisonBandLabel(band: MultiTrackKeeperComparisonBand): string {
  if (band === "excellent") return "Excellent";
  if (band === "strong") return "Strong";
  if (band === "medium") return "Medium";
  if (band === "weak") return "Weak";
  return "Missing";
}

export function getMultiTrackKeeperComparisonSignalKindLabel(
  kind: MultiTrackKeeperComparisonSignalKind,
): string {
  if (kind === "hook-match") return "Hook Match";
  if (kind === "melody-match") return "Melody Match";
  if (kind === "rhythm-match") return "Rhythm Match";
  if (kind === "lyric-phrasing-match") return "Lyric Phrasing";
  if (kind === "energy-match") return "Energy Match";
  if (kind === "structure-match") return "Structure Match";
  if (kind === "mutation-distance") return "Mutation Distance";
  return "Survivor Strength";
}

export function getMultiTrackKeeperComparisonVersionScore(
  version: MultiTrackKeeperComparisonVersion,
): number {
  const originalWeight = version.originalIdeaMatchScore * 0.24;
  const hookWeight = version.hookPreservationScore * 0.26;
  const survivorWeight = version.survivorScore * 0.2;
  const arrangementWeight = version.arrangementScore * 0.12;
  const extractionWeight = version.extractionScore * 0.12;
  const mutationUsefulness = getMultiTrackKeeperComparisonMutationUsefulness(version) * 0.06;

  return Math.round(
    originalWeight +
      hookWeight +
      survivorWeight +
      arrangementWeight +
      extractionWeight +
      mutationUsefulness,
  );
}

export function getMultiTrackKeeperComparisonMutationUsefulness(
  version: MultiTrackKeeperComparisonVersion,
): number {
  const distance = version.mutationDistanceScore;

  if (distance < 15) return 55;
  if (distance <= 35) return 92;
  if (distance <= 55) return 82;
  if (distance <= 70) return 64;
  return 28;
}

export function sortMultiTrackKeeperComparisonVersionsByScore(
  versions: MultiTrackKeeperComparisonVersion[],
): MultiTrackKeeperComparisonVersion[] {
  return [...versions].sort(
    (left, right) =>
      getMultiTrackKeeperComparisonVersionScore(right) -
      getMultiTrackKeeperComparisonVersionScore(left),
  );
}

export function getMultiTrackKeeperComparisonBestVersion(
  versions: MultiTrackKeeperComparisonVersion[],
): MultiTrackKeeperComparisonVersion | undefined {
  return sortMultiTrackKeeperComparisonVersionsByScore(versions)[0];
}

export function getMultiTrackKeeperComparisonOriginalVersion(
  state: MultiTrackKeeperComparisonWorkspaceState,
): MultiTrackKeeperComparisonVersion | undefined {
  return state.versions.find((version) => version.id === state.originalVersionId);
}

export function getMultiTrackKeeperComparisonVersionsByDecision(
  versions: MultiTrackKeeperComparisonVersion[],
  decision: MultiTrackKeeperComparisonDecision,
): MultiTrackKeeperComparisonVersion[] {
  return versions.filter((version) => version.decision === decision);
}

export function getMultiTrackKeeperComparisonVersionsByReadiness(
  versions: MultiTrackKeeperComparisonVersion[],
  readinessStatus: MultiTrackKeeperComparisonReadinessStatus,
): MultiTrackKeeperComparisonVersion[] {
  return versions.filter((version) => version.readinessStatus === readinessStatus);
}

export function getMultiTrackKeeperComparisonPairScore(pair: MultiTrackKeeperComparisonPair): number {
  const sharedWeight = pair.sharedIdeaScore * 0.7;
  const mutationUsefulness = getMultiTrackKeeperComparisonPairMutationUsefulness(pair) * 0.3;

  return Math.round(sharedWeight + mutationUsefulness);
}

export function getMultiTrackKeeperComparisonPairMutationUsefulness(
  pair: MultiTrackKeeperComparisonPair,
): number {
  if (pair.mutationDifferenceScore <= 10) return 48;
  if (pair.mutationDifferenceScore <= 35) return 94;
  if (pair.mutationDifferenceScore <= 55) return 80;
  if (pair.mutationDifferenceScore <= 70) return 58;
  return 22;
}

export function getMultiTrackKeeperComparisonVersionTitle(
  state: MultiTrackKeeperComparisonWorkspaceState,
  versionId: string,
): string {
  return state.versions.find((version) => version.id === versionId)?.title ?? "Unknown version";
}

export function getMultiTrackKeeperComparisonWorkspaceSummary(
  state: MultiTrackKeeperComparisonWorkspaceState,
): {
  versionCount: number;
  promoteCount: number;
  reviewCount: number;
  archiveCount: number;
  readyCount: number;
  bestVersionTitle: string;
  bestVersionScore: number;
  originalTitle: string;
} {
  const bestVersion = getMultiTrackKeeperComparisonBestVersion(state.versions);
  const originalVersion = getMultiTrackKeeperComparisonOriginalVersion(state);

  return {
    versionCount: state.versions.length,
    promoteCount: getMultiTrackKeeperComparisonVersionsByDecision(state.versions, "promote").length,
    reviewCount: getMultiTrackKeeperComparisonVersionsByDecision(state.versions, "review").length,
    archiveCount: getMultiTrackKeeperComparisonVersionsByDecision(state.versions, "archive").length,
    readyCount: getMultiTrackKeeperComparisonVersionsByReadiness(state.versions, "ready").length,
    bestVersionTitle: bestVersion?.title ?? "No best version",
    bestVersionScore: bestVersion ? getMultiTrackKeeperComparisonVersionScore(bestVersion) : 0,
    originalTitle: originalVersion?.title ?? "No original anchor",
  };
}

export function getMultiTrackKeeperComparisonDecisionTone(
  decision: MultiTrackKeeperComparisonDecision,
): string {
  if (decision === "promote") return "Primary keeper path";
  if (decision === "review") return "Needs human review";
  if (decision === "archive") return "Archive path";
  if (decision === "extract") return "Extraction path";
  if (decision === "duplicate") return "Duplication path";
  return "Hold for later";
}

export function getMultiTrackKeeperComparisonRiskCount(
  version: MultiTrackKeeperComparisonVersion,
): number {
  return version.risks.length;
}