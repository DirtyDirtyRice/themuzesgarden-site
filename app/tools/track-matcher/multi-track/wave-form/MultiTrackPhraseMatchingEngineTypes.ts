export type MultiTrackPhraseMatchingReadiness =
  | "ready"
  | "needs-review"
  | "future"
  | "blocked";

export type MultiTrackPhraseMatchStatus =
  | "same-phrase"
  | "close-phrase"
  | "review"
  | "different"
  | "future";

export type MultiTrackPhraseMatchSource =
  | "manual"
  | "seed"
  | "version-alignment"
  | "similarity-engine"
  | "riff-grouping"
  | "future-waveform"
  | "future-ai";

export type MultiTrackPhraseRole =
  | "hook"
  | "riff"
  | "answer"
  | "verse"
  | "chorus"
  | "bridge"
  | "intro"
  | "outro"
  | "unknown";

export type MultiTrackPhraseFeature =
  | "start-shape"
  | "ending-shape"
  | "melodic-contour"
  | "rhythm-pocket"
  | "note-family"
  | "energy-arc"
  | "listener-memory"
  | "manual-confirmation";

export type MultiTrackPhraseTimeRange = {
  startSecond: number;
  endSecond: number;
  durationSecond: number;
  label: string;
};

export type MultiTrackPhraseFeatureScore = {
  id: string;
  feature: MultiTrackPhraseFeature;
  label: string;
  score: number;
  weight: number;
  detail: string;
};

export type MultiTrackPhraseCandidate = {
  id: string;
  label: string;
  trackId: string;
  trackLabel: string;
  versionLabel: string;
  phraseRole: MultiTrackPhraseRole;
  source: MultiTrackPhraseMatchSource;
  readiness: MultiTrackPhraseMatchingReadiness;
  timeRange: MultiTrackPhraseTimeRange;
  normalizedKey: string;
  normalizedBpm: number;
  colorFamily: string;
  noteShape: string;
  rhythmShape: string;
  detail: string;
};

export type MultiTrackPhraseMatch = {
  id: string;
  label: string;
  referencePhraseId: string;
  candidatePhraseId: string;
  phraseRole: MultiTrackPhraseRole;
  source: MultiTrackPhraseMatchSource;
  status: MultiTrackPhraseMatchStatus;
  readiness: MultiTrackPhraseMatchingReadiness;
  timingDriftSecond: number;
  noteMatchPercent: number;
  rhythmMatchPercent: number;
  contourMatchPercent: number;
  memoryMatchPercent: number;
  totalMatchPercent: number;
  featureScores: MultiTrackPhraseFeatureScore[];
  decision: "accept" | "review" | "reject" | "future";
  detail: string;
};

export type MultiTrackPhraseFamily = {
  id: string;
  label: string;
  colorFamily: string;
  phraseRole: MultiTrackPhraseRole;
  referencePhraseId: string;
  readiness: MultiTrackPhraseMatchingReadiness;
  minimumMatchPercent: number;
  phrases: MultiTrackPhraseCandidate[];
  matches: MultiTrackPhraseMatch[];
  detail: string;
};

export type MultiTrackPhraseMatchingPlan = {
  id: string;
  label: string;
  familyId: string;
  acceptedCount: number;
  reviewCount: number;
  rejectedCount: number;
  averageMatchPercent: number;
  nextAction: string;
};

export type MultiTrackPhraseMatchingEngineState = {
  id: string;
  title: string;
  description: string;
  readiness: MultiTrackPhraseMatchingReadiness;
  targetKey: string;
  targetBpm: number;
  minimumSamePhrasePercent: number;
  reviewPhrasePercent: number;
  families: MultiTrackPhraseFamily[];
  plans: MultiTrackPhraseMatchingPlan[];
  engineNotes: string[];
};