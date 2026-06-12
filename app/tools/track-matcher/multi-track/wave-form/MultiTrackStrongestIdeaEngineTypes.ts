export type MultiTrackStrongestIdeaReadiness =
  | "ready"
  | "needs-review"
  | "future"
  | "blocked";

export type MultiTrackStrongestIdeaVerdict =
  | "strongest"
  | "contender"
  | "supporting"
  | "needs-more-evidence"
  | "reject";

export type MultiTrackStrongestIdeaEvidenceLevel =
  | "verified"
  | "strong"
  | "moderate"
  | "weak"
  | "missing";

export type MultiTrackStrongestIdeaScoreBand =
  | "elite"
  | "high"
  | "medium"
  | "low"
  | "unknown";

export type MultiTrackStrongestIdeaSourceKind =
  | "suno-version"
  | "riff-group"
  | "clip-lane"
  | "experiment-lane"
  | "manual-listening"
  | "future-detector"
  | "seed";

export type MultiTrackStrongestIdeaSectionRole =
  | "intro"
  | "verse"
  | "pre-chorus"
  | "chorus"
  | "hook"
  | "riff"
  | "bridge"
  | "breakdown"
  | "outro"
  | "unknown";

export type MultiTrackStrongestIdeaSignalKind =
  | "hook-strength"
  | "riff-survival"
  | "repeat-value"
  | "listener-memory"
  | "arrangement-potential"
  | "edit-potential"
  | "experiment-potential"
  | "render-potential"
  | "manual-confirmation";

export type MultiTrackStrongestIdeaRiskKind =
  | "weak-evidence"
  | "timing-drift"
  | "needs-listening"
  | "bpm-key-not-normalized"
  | "too-short"
  | "too-busy"
  | "overlap-conflict"
  | "future-only";

export type MultiTrackStrongestIdeaTimeRange = {
  startSecond: number;
  endSecond: number;
};

export type MultiTrackStrongestIdeaSource = {
  id: string;
  label: string;
  kind: MultiTrackStrongestIdeaSourceKind;
  trackNumber: number;
  versionLabel: string;
  detail: string;
};

export type MultiTrackStrongestIdeaSignal = {
  id: string;
  kind: MultiTrackStrongestIdeaSignalKind;
  label: string;
  description: string;
  score: number;
  weight: number;
  evidenceLevel: MultiTrackStrongestIdeaEvidenceLevel;
};

export type MultiTrackStrongestIdeaRisk = {
  id: string;
  kind: MultiTrackStrongestIdeaRiskKind;
  label: string;
  description: string;
  severity: number;
  isBlocking: boolean;
};

export type MultiTrackStrongestIdeaCandidate = {
  id: string;
  sourceId: string;
  title: string;
  summary: string;
  sectionRole: MultiTrackStrongestIdeaSectionRole;
  timeRange: MultiTrackStrongestIdeaTimeRange;
  readiness: MultiTrackStrongestIdeaReadiness;
  verdict: MultiTrackStrongestIdeaVerdict;
  musicalReason: string;
  productionReason: string;
  listenerReason: string;
  signals: MultiTrackStrongestIdeaSignal[];
  risks: MultiTrackStrongestIdeaRisk[];
  manualBoost: number;
  manualPenalty: number;
};

export type MultiTrackStrongestIdeaScoreBreakdown = {
  candidateId: string;
  positiveScore: number;
  weightedSignalScore: number;
  riskPenalty: number;
  manualAdjustment: number;
  finalScore: number;
  scoreBand: MultiTrackStrongestIdeaScoreBand;
};

export type MultiTrackStrongestIdeaRankedCandidate = {
  candidate: MultiTrackStrongestIdeaCandidate;
  score: MultiTrackStrongestIdeaScoreBreakdown;
  rank: number;
  rankLabel: string;
};

export type MultiTrackStrongestIdeaEngineSummary = {
  totalSources: number;
  totalCandidates: number;
  readyCandidates: number;
  blockedCandidates: number;
  strongestCandidateId: string;
  strongestCandidateTitle: string;
  strongestScore: number;
  strongestBand: MultiTrackStrongestIdeaScoreBand;
  needsReviewCount: number;
};

export type MultiTrackStrongestIdeaEngineState = {
  id: string;
  title: string;
  description: string;
  readiness: MultiTrackStrongestIdeaReadiness;
  targetKey: string;
  targetBpm: number;
  sourceTrackGoal: number;
  selectedCandidateId: string;
  sources: MultiTrackStrongestIdeaSource[];
  candidates: MultiTrackStrongestIdeaCandidate[];
  engineNotes: string[];
  lockedReason: string;
};

export type MultiTrackStrongestIdeaEngineReport = {
  state: MultiTrackStrongestIdeaEngineState;
  rankedCandidates: MultiTrackStrongestIdeaRankedCandidate[];
  selectedCandidate: MultiTrackStrongestIdeaCandidate | null;
  summary: MultiTrackStrongestIdeaEngineSummary;
};