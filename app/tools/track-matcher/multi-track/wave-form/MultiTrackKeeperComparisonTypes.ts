export type MultiTrackKeeperComparisonReadinessStatus =
  | "ready"
  | "needs-review"
  | "blocked"
  | "future";

export type MultiTrackKeeperComparisonSourceKind =
  | "original-phone-idea"
  | "suno-version"
  | "manual-upload"
  | "stem-render"
  | "reference-bounce"
  | "seed";

export type MultiTrackKeeperComparisonRole =
  | "original"
  | "closest-match"
  | "strongest-hook"
  | "best-mutation"
  | "arrangement-candidate"
  | "archive-candidate"
  | "review-candidate";

export type MultiTrackKeeperComparisonDecision =
  | "promote"
  | "review"
  | "archive"
  | "extract"
  | "duplicate"
  | "hold";

export type MultiTrackKeeperComparisonSignalKind =
  | "hook-match"
  | "melody-match"
  | "rhythm-match"
  | "lyric-phrasing-match"
  | "energy-match"
  | "structure-match"
  | "mutation-distance"
  | "survivor-strength";

export type MultiTrackKeeperComparisonBand =
  | "excellent"
  | "strong"
  | "medium"
  | "weak"
  | "missing";

export type MultiTrackKeeperComparisonSignal = {
  id: string;
  kind: MultiTrackKeeperComparisonSignalKind;
  label: string;
  score: number;
  maxScore: number;
  band: MultiTrackKeeperComparisonBand;
  detail: string;
};

export type MultiTrackKeeperComparisonVersion = {
  id: string;
  title: string;
  versionLabel: string;
  sourceKind: MultiTrackKeeperComparisonSourceKind;
  role: MultiTrackKeeperComparisonRole;
  readinessStatus: MultiTrackKeeperComparisonReadinessStatus;
  decision: MultiTrackKeeperComparisonDecision;
  originalIdeaMatchScore: number;
  hookPreservationScore: number;
  mutationDistanceScore: number;
  survivorScore: number;
  arrangementScore: number;
  extractionScore: number;
  colorPath: string;
  signals: MultiTrackKeeperComparisonSignal[];
  strengths: string[];
  risks: string[];
  notes: string[];
};

export type MultiTrackKeeperComparisonPair = {
  id: string;
  leftVersionId: string;
  rightVersionId: string;
  label: string;
  sharedIdeaScore: number;
  mutationDifferenceScore: number;
  recommendation: MultiTrackKeeperComparisonDecision;
  detail: string;
};

export type MultiTrackKeeperComparisonRank = {
  id: string;
  versionId: string;
  rank: number;
  label: string;
  score: number;
  reason: string;
};

export type MultiTrackKeeperComparisonWorkspaceState = {
  id: string;
  title: string;
  description: string;
  readinessStatus: MultiTrackKeeperComparisonReadinessStatus;
  originalVersionId: string;
  versions: MultiTrackKeeperComparisonVersion[];
  pairs: MultiTrackKeeperComparisonPair[];
  ranks: MultiTrackKeeperComparisonRank[];
  notes: string[];
};