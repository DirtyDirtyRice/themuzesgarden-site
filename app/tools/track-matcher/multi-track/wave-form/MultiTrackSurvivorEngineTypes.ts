export type MultiTrackSurvivorEngineReadiness =
  | "ready"
  | "needs-mutation-map"
  | "needs-riff-groups"
  | "needs-review"
  | "blocked"
  | "future";

export type MultiTrackSurvivorEngineStatus =
  | "ranked"
  | "estimated"
  | "seeded"
  | "missing"
  | "future";

export type MultiTrackSurvivorEngineRisk =
  | "low"
  | "medium"
  | "high"
  | "blocked";

export type MultiTrackSurvivorEngineDecision =
  | "promote"
  | "hold"
  | "review"
  | "reject"
  | "future";

export type MultiTrackSurvivorEngineSourceKind =
  | "original"
  | "suno-version"
  | "riff-family"
  | "mutation-family"
  | "stem"
  | "hybrid-render";

export type MultiTrackSurvivorEngineEvidenceKind =
  | "mutation-survival"
  | "riff-family-strength"
  | "similarity"
  | "transient-anchor"
  | "energy-shape"
  | "timing-drift"
  | "repeat-value"
  | "risk-flag"
  | "manual-note";

export type MultiTrackSurvivorEngineCandidateRole =
  | "primary-hook"
  | "supporting-repeat"
  | "variation"
  | "bridge-lift"
  | "intro-idea"
  | "turnaround"
  | "unknown";

export type MultiTrackSurvivorEngineScoreBreakdown = {
  survivalScore: number;
  mutationScore: number;
  riffGroupScore: number;
  similarityScore: number;
  transientScore: number;
  energyScore: number;
  timingScore: number;
  riskPenalty: number;
  finalScore: number;
};

export type MultiTrackSurvivorEngineEvidence = {
  evidenceId: string;
  kind: MultiTrackSurvivorEngineEvidenceKind;
  title: string;
  detail: string;
  scoreImpact: number;
  status: MultiTrackSurvivorEngineStatus;
  risk: MultiTrackSurvivorEngineRisk;
};

export type MultiTrackSurvivorEngineCandidate = {
  candidateId: string;
  title: string;
  sourceKind: MultiTrackSurvivorEngineSourceKind;
  role: MultiTrackSurvivorEngineCandidateRole;
  sourceVersionId: string;
  riffFamilyId: string;
  mutationFamilyId: string;
  startMs: number;
  endMs: number;
  rank: number;
  decision: MultiTrackSurvivorEngineDecision;
  readiness: MultiTrackSurvivorEngineReadiness;
  scoreBreakdown: MultiTrackSurvivorEngineScoreBreakdown;
  evidence: MultiTrackSurvivorEngineEvidence[];
  recommendation: string;
  extractionHint: string;
  notes: string[];
  status: MultiTrackSurvivorEngineStatus;
  risk: MultiTrackSurvivorEngineRisk;
};

export type MultiTrackSurvivorEngineComparison = {
  comparisonId: string;
  title: string;
  leftCandidateId: string;
  rightCandidateId: string;
  winnerCandidateId: string;
  scoreDifference: number;
  detail: string;
  decisionReason: string;
  status: MultiTrackSurvivorEngineStatus;
  risk: MultiTrackSurvivorEngineRisk;
};

export type MultiTrackSurvivorEngineFinding = {
  findingId: string;
  title: string;
  detail: string;
  action: string;
  status: MultiTrackSurvivorEngineStatus;
  risk: MultiTrackSurvivorEngineRisk;
};

export type MultiTrackSurvivorEngineWorkspace = {
  workspaceId: string;
  title: string;
  summary: string;
  readiness: MultiTrackSurvivorEngineReadiness;
  readinessLabel: string;
  engineGoal: string;
  engineBoundary: string;
  candidates: MultiTrackSurvivorEngineCandidate[];
  comparisons: MultiTrackSurvivorEngineComparison[];
  findings: MultiTrackSurvivorEngineFinding[];
  engineRules: string[];
  nextSteps: string[];
};
