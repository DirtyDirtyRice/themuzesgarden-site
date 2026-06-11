export type MultiTrackSurvivorAnalysisReadinessStatus =
  | "ready"
  | "needs-review"
  | "blocked"
  | "future";

export type MultiTrackSurvivorAnalysisVersionId =
  | "original"
  | "version-01"
  | "version-02"
  | "version-03"
  | "version-04"
  | "version-05"
  | "version-06"
  | "version-07"
  | "version-08"
  | "version-09"
  | "version-10";

export type MultiTrackSurvivorAnalysisCandidateKind =
  | "hook"
  | "riff"
  | "melody"
  | "bass-motion"
  | "drum-pocket"
  | "vocal-phrase"
  | "hybrid-section";

export type MultiTrackSurvivorAnalysisOutcome =
  | "winner"
  | "runner-up"
  | "support"
  | "review"
  | "hold"
  | "reject";

export type MultiTrackSurvivorAnalysisColor =
  | "white"
  | "blue"
  | "green"
  | "purple"
  | "yellow"
  | "orange"
  | "red"
  | "pink";

export type MultiTrackSurvivorAnalysisConfidenceBucket =
  | "verified"
  | "strong"
  | "moderate"
  | "weak"
  | "unknown"
  | "blocked";

export type MultiTrackSurvivorAnalysisRiskKind =
  | "missing-audio"
  | "missing-waveform"
  | "weak-survivor"
  | "conflicting-winner"
  | "manual-review"
  | "future-analyzer";

export type MultiTrackSurvivorAnalysisTimeRange = {
  startSeconds: number;
  endSeconds: number;
  label: string;
};

export type MultiTrackSurvivorAnalysisCandidate = {
  id: string;
  title: string;
  versionId: MultiTrackSurvivorAnalysisVersionId;
  candidateKind: MultiTrackSurvivorAnalysisCandidateKind;
  color: MultiTrackSurvivorAnalysisColor;
  timeRange: MultiTrackSurvivorAnalysisTimeRange;
  summary: string;
  identityScore: number;
  editScore: number;
  renderScore: number;
  keeperScore: number;
  outcome: MultiTrackSurvivorAnalysisOutcome;
  confidenceBucket: MultiTrackSurvivorAnalysisConfidenceBucket;
  readinessStatus: MultiTrackSurvivorAnalysisReadinessStatus;
};

export type MultiTrackSurvivorAnalysisRisk = {
  id: string;
  riskKind: MultiTrackSurvivorAnalysisRiskKind;
  label: string;
  detail: string;
  severity: "low" | "medium" | "high";
  isBlocking: boolean;
};

export type MultiTrackSurvivorAnalysisReason = {
  id: string;
  candidateId: string;
  label: string;
  detail: string;
  weight: number;
  confidenceBucket: MultiTrackSurvivorAnalysisConfidenceBucket;
};

export type MultiTrackSurvivorAnalysisGroup = {
  id: string;
  title: string;
  detail: string;
  candidateIds: string[];
  winnerCandidateId: string | null;
  runnerUpCandidateId: string | null;
  riskIds: string[];
  color: MultiTrackSurvivorAnalysisColor;
  readinessStatus: MultiTrackSurvivorAnalysisReadinessStatus;
};

export type MultiTrackSurvivorAnalysisLane = {
  id: string;
  label: string;
  detail: string;
  color: MultiTrackSurvivorAnalysisColor;
  candidateIds: string[];
  readinessStatus: MultiTrackSurvivorAnalysisReadinessStatus;
};

export type MultiTrackSurvivorAnalysisWorkspaceState = {
  id: string;
  title: string;
  description: string;
  candidates: MultiTrackSurvivorAnalysisCandidate[];
  reasons: MultiTrackSurvivorAnalysisReason[];
  risks: MultiTrackSurvivorAnalysisRisk[];
  groups: MultiTrackSurvivorAnalysisGroup[];
  lanes: MultiTrackSurvivorAnalysisLane[];
  activeGroupId: string;
  activeCandidateId: string;
  readinessStatus: MultiTrackSurvivorAnalysisReadinessStatus;
  guardrailNotes: string[];
};

export type MultiTrackSurvivorAnalysisCandidateSummary = {
  candidateId: string;
  title: string;
  versionId: MultiTrackSurvivorAnalysisVersionId;
  candidateKind: MultiTrackSurvivorAnalysisCandidateKind;
  outcome: MultiTrackSurvivorAnalysisOutcome;
  totalScore: number;
  confidenceBucket: MultiTrackSurvivorAnalysisConfidenceBucket;
  readinessStatus: MultiTrackSurvivorAnalysisReadinessStatus;
};

export type MultiTrackSurvivorAnalysisGroupSummary = {
  groupId: string;
  title: string;
  candidateCount: number;
  winnerTitle: string;
  runnerUpTitle: string;
  readinessStatus: MultiTrackSurvivorAnalysisReadinessStatus;
};

export type MultiTrackSurvivorAnalysisReviewPacket = {
  activeGroup: MultiTrackSurvivorAnalysisGroup | null;
  activeCandidate: MultiTrackSurvivorAnalysisCandidate | null;
  groupCandidates: MultiTrackSurvivorAnalysisCandidate[];
  reasons: MultiTrackSurvivorAnalysisReason[];
  risks: MultiTrackSurvivorAnalysisRisk[];
};

export type MultiTrackSurvivorAnalysisValidationResult = {
  isValid: boolean;
  winnerCount: number;
  reviewCount: number;
  futureCount: number;
  blockedCount: number;
  messages: string[];
};