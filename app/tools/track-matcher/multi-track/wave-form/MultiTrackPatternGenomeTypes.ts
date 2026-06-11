export type MultiTrackPatternGenomeReadinessStatus =
  | "ready"
  | "needs-review"
  | "blocked"
  | "future";

export type MultiTrackPatternGenomeIdeaRole =
  | "hook"
  | "riff"
  | "verse-motif"
  | "chorus-motif"
  | "bass-motion"
  | "drum-pocket"
  | "vocal-phrase"
  | "counter-melody"
  | "transition"
  | "unknown";

export type MultiTrackPatternGenomeSourceKind =
  | "suno-version"
  | "user-original"
  | "reference"
  | "stem"
  | "manual-marker"
  | "future-analyzer";

export type MultiTrackPatternGenomeConfidenceBucket =
  | "verified"
  | "strong"
  | "moderate"
  | "weak"
  | "unknown"
  | "blocked";

export type MultiTrackPatternGenomeColor =
  | "white"
  | "blue"
  | "green"
  | "purple"
  | "yellow"
  | "orange"
  | "red"
  | "pink";

export type MultiTrackPatternGenomeActionKind =
  | "color-code"
  | "extract"
  | "edit"
  | "duplicate"
  | "render"
  | "compare"
  | "promote"
  | "hold";

export type MultiTrackPatternGenomeSignalKind =
  | "melody-contour"
  | "rhythm-shape"
  | "interval-motion"
  | "chord-anchor"
  | "lyric-phrase"
  | "stem-energy"
  | "section-position"
  | "manual-note";

export type MultiTrackPatternGenomeRiskKind =
  | "missing-audio"
  | "missing-bpm"
  | "missing-key"
  | "missing-section-map"
  | "weak-similarity"
  | "conflicting-versions"
  | "manual-review-needed"
  | "future-engine-required";

export type MultiTrackPatternGenomeVersionId =
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

export type MultiTrackPatternGenomeTimeRange = {
  startSeconds: number;
  endSeconds: number;
  label: string;
};

export type MultiTrackPatternGenomeSource = {
  id: string;
  versionId: MultiTrackPatternGenomeVersionId;
  sourceKind: MultiTrackPatternGenomeSourceKind;
  title: string;
  artistLabel: string;
  fileLabel: string;
  bpm: number | null;
  keyLabel: string | null;
  durationSeconds: number | null;
  readinessStatus: MultiTrackPatternGenomeReadinessStatus;
  notes: string[];
};

export type MultiTrackPatternGenomeSignal = {
  id: string;
  signalKind: MultiTrackPatternGenomeSignalKind;
  label: string;
  detail: string;
  weight: number;
  confidenceBucket: MultiTrackPatternGenomeConfidenceBucket;
};

export type MultiTrackPatternGenomeEvidence = {
  id: string;
  sourceId: string;
  versionId: MultiTrackPatternGenomeVersionId;
  timeRange: MultiTrackPatternGenomeTimeRange;
  signalIds: string[];
  summary: string;
  confidenceBucket: MultiTrackPatternGenomeConfidenceBucket;
  reviewerNote: string;
};

export type MultiTrackPatternGenomeRisk = {
  id: string;
  riskKind: MultiTrackPatternGenomeRiskKind;
  label: string;
  detail: string;
  severity: "low" | "medium" | "high";
  isBlocking: boolean;
};

export type MultiTrackPatternGenomeAction = {
  id: string;
  actionKind: MultiTrackPatternGenomeActionKind;
  label: string;
  detail: string;
  readinessStatus: MultiTrackPatternGenomeReadinessStatus;
  targetIdeaId: string;
};

export type MultiTrackPatternGenomeIdea = {
  id: string;
  title: string;
  role: MultiTrackPatternGenomeIdeaRole;
  color: MultiTrackPatternGenomeColor;
  summary: string;
  primaryVersionId: MultiTrackPatternGenomeVersionId;
  matchedVersionIds: MultiTrackPatternGenomeVersionId[];
  evidenceIds: string[];
  riskIds: string[];
  actionIds: string[];
  confidenceBucket: MultiTrackPatternGenomeConfidenceBucket;
  readinessStatus: MultiTrackPatternGenomeReadinessStatus;
};

export type MultiTrackPatternGenomeComparison = {
  id: string;
  ideaId: string;
  fromVersionId: MultiTrackPatternGenomeVersionId;
  toVersionId: MultiTrackPatternGenomeVersionId;
  similarityPercent: number;
  sharedSignals: MultiTrackPatternGenomeSignalKind[];
  differenceSummary: string;
  confidenceBucket: MultiTrackPatternGenomeConfidenceBucket;
};

export type MultiTrackPatternGenomeRenderTarget = {
  id: string;
  ideaId: string;
  label: string;
  detail: string;
  sourceVersionIds: MultiTrackPatternGenomeVersionId[];
  targetFormat: "wav" | "mp3" | "stems" | "future-session";
  readinessStatus: MultiTrackPatternGenomeReadinessStatus;
};

export type MultiTrackPatternGenomeLane = {
  id: string;
  label: string;
  detail: string;
  ideaIds: string[];
  color: MultiTrackPatternGenomeColor;
  readinessStatus: MultiTrackPatternGenomeReadinessStatus;
};

export type MultiTrackPatternGenomeWorkspaceState = {
  id: string;
  title: string;
  description: string;
  sources: MultiTrackPatternGenomeSource[];
  signals: MultiTrackPatternGenomeSignal[];
  evidence: MultiTrackPatternGenomeEvidence[];
  risks: MultiTrackPatternGenomeRisk[];
  actions: MultiTrackPatternGenomeAction[];
  ideas: MultiTrackPatternGenomeIdea[];
  comparisons: MultiTrackPatternGenomeComparison[];
  renderTargets: MultiTrackPatternGenomeRenderTarget[];
  lanes: MultiTrackPatternGenomeLane[];
  activeIdeaId: string;
  readinessStatus: MultiTrackPatternGenomeReadinessStatus;
  guardrailNotes: string[];
};

export type MultiTrackPatternGenomeIdeaSummary = {
  ideaId: string;
  title: string;
  role: MultiTrackPatternGenomeIdeaRole;
  color: MultiTrackPatternGenomeColor;
  matchedCount: number;
  confidenceBucket: MultiTrackPatternGenomeConfidenceBucket;
  readinessStatus: MultiTrackPatternGenomeReadinessStatus;
};

export type MultiTrackPatternGenomeVersionCoverage = {
  versionId: MultiTrackPatternGenomeVersionId;
  sourceTitle: string;
  ideaCount: number;
  strongestIdeaTitle: string;
  averageSimilarityPercent: number;
  readinessStatus: MultiTrackPatternGenomeReadinessStatus;
};

export type MultiTrackPatternGenomeReviewPacket = {
  activeIdea: MultiTrackPatternGenomeIdea | null;
  activeEvidence: MultiTrackPatternGenomeEvidence[];
  activeActions: MultiTrackPatternGenomeAction[];
  activeRisks: MultiTrackPatternGenomeRisk[];
  activeComparisons: MultiTrackPatternGenomeComparison[];
  renderTargets: MultiTrackPatternGenomeRenderTarget[];
};

export type MultiTrackPatternGenomeBoardColumn = {
  id: string;
  title: string;
  detail: string;
  ideaIds: string[];
  readinessStatus: MultiTrackPatternGenomeReadinessStatus;
};

export type MultiTrackPatternGenomeBoard = {
  columns: MultiTrackPatternGenomeBoardColumn[];
};

export type MultiTrackPatternGenomeValidationResult = {
  isValid: boolean;
  readyCount: number;
  reviewCount: number;
  blockedCount: number;
  messages: string[];
};

export type MultiTrackPatternGenomeFilter = {
  searchText: string;
  role: MultiTrackPatternGenomeIdeaRole | "all";
  color: MultiTrackPatternGenomeColor | "all";
  confidenceBucket: MultiTrackPatternGenomeConfidenceBucket | "all";
  readinessStatus: MultiTrackPatternGenomeReadinessStatus | "all";
};