export type MultiTrackMutationMapReadinessStatus =
  | "ready"
  | "needs-review"
  | "blocked"
  | "future";

export type MultiTrackMutationMapVersionId =
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

export type MultiTrackMutationMapMutationKind =
  | "preserved"
  | "expanded"
  | "simplified"
  | "tempo-shifted"
  | "key-shifted"
  | "rhythm-shifted"
  | "melody-shifted"
  | "lyric-shifted"
  | "instrument-shifted"
  | "energy-shifted"
  | "weakened"
  | "lost";

export type MultiTrackMutationMapIdeaKind =
  | "hook"
  | "riff"
  | "melody"
  | "bass-motion"
  | "drum-pocket"
  | "vocal-phrase"
  | "section-shape"
  | "hybrid";

export type MultiTrackMutationMapColor =
  | "white"
  | "blue"
  | "green"
  | "purple"
  | "yellow"
  | "orange"
  | "red"
  | "pink";

export type MultiTrackMutationMapConfidenceBucket =
  | "verified"
  | "strong"
  | "moderate"
  | "weak"
  | "unknown"
  | "blocked";

export type MultiTrackMutationMapRiskKind =
  | "missing-audio"
  | "missing-waveform"
  | "weak-match"
  | "conflicting-mutation"
  | "manual-review"
  | "future-analyzer";

export type MultiTrackMutationMapTimeRange = {
  startSeconds: number;
  endSeconds: number;
  label: string;
};

export type MultiTrackMutationMapPoint = {
  id: string;
  title: string;
  versionId: MultiTrackMutationMapVersionId;
  ideaKind: MultiTrackMutationMapIdeaKind;
  mutationKind: MultiTrackMutationMapMutationKind;
  color: MultiTrackMutationMapColor;
  timeRange: MultiTrackMutationMapTimeRange;
  summary: string;
  mutationStrength: number;
  keeperScore: number;
  parentPointId: string | null;
  confidenceBucket: MultiTrackMutationMapConfidenceBucket;
  readinessStatus: MultiTrackMutationMapReadinessStatus;
};

export type MultiTrackMutationMapRisk = {
  id: string;
  riskKind: MultiTrackMutationMapRiskKind;
  label: string;
  detail: string;
  severity: "low" | "medium" | "high";
  isBlocking: boolean;
};

export type MultiTrackMutationMapSignal = {
  id: string;
  pointId: string;
  label: string;
  detail: string;
  value: number;
  confidenceBucket: MultiTrackMutationMapConfidenceBucket;
};

export type MultiTrackMutationMapPath = {
  id: string;
  title: string;
  detail: string;
  pointIds: string[];
  strongestPointId: string | null;
  color: MultiTrackMutationMapColor;
  riskIds: string[];
  readinessStatus: MultiTrackMutationMapReadinessStatus;
};

export type MultiTrackMutationMapLane = {
  id: string;
  label: string;
  detail: string;
  color: MultiTrackMutationMapColor;
  pathIds: string[];
  readinessStatus: MultiTrackMutationMapReadinessStatus;
};

export type MultiTrackMutationMapWorkspaceState = {
  id: string;
  title: string;
  description: string;
  points: MultiTrackMutationMapPoint[];
  signals: MultiTrackMutationMapSignal[];
  risks: MultiTrackMutationMapRisk[];
  paths: MultiTrackMutationMapPath[];
  lanes: MultiTrackMutationMapLane[];
  activePathId: string;
  activePointId: string;
  readinessStatus: MultiTrackMutationMapReadinessStatus;
  guardrailNotes: string[];
};

export type MultiTrackMutationMapPointSummary = {
  pointId: string;
  title: string;
  versionId: MultiTrackMutationMapVersionId;
  mutationKind: MultiTrackMutationMapMutationKind;
  mutationStrength: number;
  keeperScore: number;
  confidenceBucket: MultiTrackMutationMapConfidenceBucket;
  readinessStatus: MultiTrackMutationMapReadinessStatus;
};

export type MultiTrackMutationMapPathSummary = {
  pathId: string;
  title: string;
  pointCount: number;
  strongestPointTitle: string;
  color: MultiTrackMutationMapColor;
  readinessStatus: MultiTrackMutationMapReadinessStatus;
};

export type MultiTrackMutationMapReviewPacket = {
  activePath: MultiTrackMutationMapPath | null;
  activePoint: MultiTrackMutationMapPoint | null;
  pathPoints: MultiTrackMutationMapPoint[];
  signals: MultiTrackMutationMapSignal[];
  risks: MultiTrackMutationMapRisk[];
};

export type MultiTrackMutationMapValidationResult = {
  isValid: boolean;
  readyCount: number;
  reviewCount: number;
  futureCount: number;
  blockedCount: number;
  messages: string[];
};