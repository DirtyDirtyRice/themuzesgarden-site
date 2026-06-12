 import type {
  MultiTrackPhraseCandidate,
 MultiTrackPhraseFamily,
  MultiTrackPhraseFeatureScore,
  MultiTrackPhraseMatch,
  MultiTrackPhraseMatchingEngineState,
  MultiTrackPhraseMatchingReadiness,
  MultiTrackPhraseMatchStatus,
  MultiTrackPhraseRole,
} from "./MultiTrackPhraseMatchingEngineTypes";

export function getPhraseMatchingReadinessLabel(
  readiness: MultiTrackPhraseMatchingReadiness,
): string {
  if (readiness === "ready") return "Ready";
  if (readiness === "needs-review") return "Needs Review";
  if (readiness === "blocked") return "Blocked";
  return "Future";
}

export function getPhraseMatchStatusLabel(status: MultiTrackPhraseMatchStatus): string {
  if (status === "same-phrase") return "Same Phrase";
  if (status === "close-phrase") return "Close Phrase";
  if (status === "review") return "Review";
  if (status === "different") return "Different";
  return "Future";
}

export function getPhraseRoleLabel(role: MultiTrackPhraseRole): string {
  if (role === "hook") return "Hook";
  if (role === "riff") return "Riff";
  if (role === "answer") return "Answer";
  if (role === "verse") return "Verse";
  if (role === "chorus") return "Chorus";
  if (role === "bridge") return "Bridge";
  if (role === "intro") return "Intro";
  if (role === "outro") return "Outro";
  return "Unknown";
}

export function getAllPhraseCandidates(
  families: MultiTrackPhraseFamily[],
): MultiTrackPhraseCandidate[] {
  return families.flatMap((family) => family.phrases);
}

export function getAllPhraseMatches(
  families: MultiTrackPhraseFamily[],
): MultiTrackPhraseMatch[] {
  return families.flatMap((family) => family.matches);
}

export function getAcceptedPhraseMatches(
  matches: MultiTrackPhraseMatch[],
): MultiTrackPhraseMatch[] {
  return matches.filter((match) => match.decision === "accept");
}

export function getReviewPhraseMatches(
  matches: MultiTrackPhraseMatch[],
): MultiTrackPhraseMatch[] {
  return matches.filter((match) => match.decision === "review");
}

export function getRejectedPhraseMatches(
  matches: MultiTrackPhraseMatch[],
): MultiTrackPhraseMatch[] {
  return matches.filter((match) => match.decision === "reject");
}

export function getPhraseMatchAveragePercent(matches: MultiTrackPhraseMatch[]): number {
  if (matches.length === 0) return 0;

  const total = matches.reduce((sum, match) => sum + match.totalMatchPercent, 0);
  return Math.round(total / matches.length);
}

export function getPhraseMatchMaxTimingDrift(matches: MultiTrackPhraseMatch[]): number {
  if (matches.length === 0) return 0;

  return Number(
    Math.max(...matches.map((match) => Math.abs(match.timingDriftSecond))).toFixed(2),
  );
}

export function getPhraseFeatureWeightedScore(scores: MultiTrackPhraseFeatureScore[]): number {
  if (scores.length === 0) return 0;

  const totalWeight = scores.reduce((sum, score) => sum + score.weight, 0);
  if (totalWeight <= 0) return 0;

  const weighted = scores.reduce((sum, score) => {
    return sum + score.score * score.weight;
  }, 0);

  return Math.round(weighted / totalWeight);
}

export function getPhraseMatchDecisionLabel(match: MultiTrackPhraseMatch): string {
  if (match.decision === "accept") return "Accept Same Phrase";
  if (match.decision === "review") return "Listening Review";
  if (match.decision === "reject") return "Reject Match";
  return "Future Detection";
}

export function getPhraseCandidateById(
  families: MultiTrackPhraseFamily[],
  phraseId: string,
): MultiTrackPhraseCandidate | null {
  return getAllPhraseCandidates(families).find((phrase) => phrase.id === phraseId) ?? null;
}

export function getPhraseFamilyScore(family: MultiTrackPhraseFamily): number {
  const accepted = getAcceptedPhraseMatches(family.matches).length;
  const review = getReviewPhraseMatches(family.matches).length;
  const average = getPhraseMatchAveragePercent(family.matches);

  return Math.max(0, Math.min(100, Math.round(average + accepted * 3 - review * 2)));
}

export function getPhraseFamilyAction(family: MultiTrackPhraseFamily): string {
  const score = getPhraseFamilyScore(family);

  if (score >= 92) return "Promote to color group";
  if (score >= 84) return "Keep with review matches";
  if (score >= 75) return "Listening pass required";
  return "Do not color group yet";
}

export function getPhraseMatchingEngineMetrics(state: MultiTrackPhraseMatchingEngineState): {
  familyCount: number;
  phraseCount: number;
  matchCount: number;
  acceptedCount: number;
  reviewCount: number;
  rejectedCount: number;
  averageMatchPercent: number;
  maxDriftSecond: number;
} {
  const phrases = getAllPhraseCandidates(state.families);
  const matches = getAllPhraseMatches(state.families);

  return {
    familyCount: state.families.length,
    phraseCount: phrases.length,
    matchCount: matches.length,
    acceptedCount: getAcceptedPhraseMatches(matches).length,
    reviewCount: getReviewPhraseMatches(matches).length,
    rejectedCount: getRejectedPhraseMatches(matches).length,
    averageMatchPercent: getPhraseMatchAveragePercent(matches),
    maxDriftSecond: getPhraseMatchMaxTimingDrift(matches),
  };
}

export function getPhraseMatchingDistanceLabel(state: MultiTrackPhraseMatchingEngineState): string {
  const metrics = getPhraseMatchingEngineMetrics(state);

  if (metrics.averageMatchPercent >= 90) return "Ready for riff color grouping";
  if (metrics.averageMatchPercent >= 84) return "Phrase review active";
  if (metrics.matchCount > 0) return "Seed phrase matching";
  return "Planning only";
}