export type MultiTrackRenderQueueReadinessStatus =
  | "ready"
  | "needs-review"
  | "blocked"
  | "future";

export type MultiTrackRenderQueueOutputFormat =
  | "wav"
  | "mp3"
  | "stem-pack"
  | "clip-pack"
  | "future-session";

export type MultiTrackRenderQueueJobKind =
  | "hook-render"
  | "riff-render"
  | "bass-loop-render"
  | "vocal-phrase-render"
  | "hybrid-section-render"
  | "stem-export"
  | "comparison-export"
  | "archive-export";

export type MultiTrackRenderQueueVersionId =
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

export type MultiTrackRenderQueuePriority =
  | "critical"
  | "high"
  | "normal"
  | "low"
  | "hold";

export type MultiTrackRenderQueueColor =
  | "white"
  | "blue"
  | "green"
  | "purple"
  | "yellow"
  | "orange"
  | "red"
  | "pink";

export type MultiTrackRenderQueueConfidenceBucket =
  | "verified"
  | "strong"
  | "moderate"
  | "weak"
  | "unknown"
  | "blocked";

export type MultiTrackRenderQueueRiskKind =
  | "missing-source"
  | "missing-extraction"
  | "bad-tail"
  | "tempo-drift"
  | "pitch-drift"
  | "stem-bleed"
  | "format-not-ready"
  | "future-render-engine"
  | "manual-review";

export type MultiTrackRenderQueueTimeRange = {
  startSeconds: number;
  endSeconds: number;
  label: string;
};

export type MultiTrackRenderQueueSource = {
  id: string;
  versionId: MultiTrackRenderQueueVersionId;
  title: string;
  fileLabel: string;
  bpm: number | null;
  keyLabel: string | null;
  timeRange: MultiTrackRenderQueueTimeRange;
  readinessStatus: MultiTrackRenderQueueReadinessStatus;
};

export type MultiTrackRenderQueueRisk = {
  id: string;
  riskKind: MultiTrackRenderQueueRiskKind;
  label: string;
  detail: string;
  severity: "low" | "medium" | "high";
  isBlocking: boolean;
};

export type MultiTrackRenderQueueSetting = {
  id: string;
  label: string;
  detail: string;
  outputFormat: MultiTrackRenderQueueOutputFormat;
  includeTail: boolean;
  tailMs: number;
  normalizeOutput: boolean;
  preserveOriginalPitch: boolean;
  preserveOriginalTempo: boolean;
  readinessStatus: MultiTrackRenderQueueReadinessStatus;
};

export type MultiTrackRenderQueueJob = {
  id: string;
  title: string;
  jobKind: MultiTrackRenderQueueJobKind;
  color: MultiTrackRenderQueueColor;
  priority: MultiTrackRenderQueuePriority;
  sourceIds: string[];
  settingId: string;
  riskIds: string[];
  outputName: string;
  destinationLabel: string;
  confidenceBucket: MultiTrackRenderQueueConfidenceBucket;
  readinessStatus: MultiTrackRenderQueueReadinessStatus;
};

export type MultiTrackRenderQueueBatch = {
  id: string;
  title: string;
  detail: string;
  jobIds: string[];
  outputFormat: MultiTrackRenderQueueOutputFormat;
  readinessStatus: MultiTrackRenderQueueReadinessStatus;
};

export type MultiTrackRenderQueueLane = {
  id: string;
  label: string;
  detail: string;
  color: MultiTrackRenderQueueColor;
  jobIds: string[];
  readinessStatus: MultiTrackRenderQueueReadinessStatus;
};

export type MultiTrackRenderQueueWorkspaceState = {
  id: string;
  title: string;
  description: string;
  sources: MultiTrackRenderQueueSource[];
  risks: MultiTrackRenderQueueRisk[];
  settings: MultiTrackRenderQueueSetting[];
  jobs: MultiTrackRenderQueueJob[];
  batches: MultiTrackRenderQueueBatch[];
  lanes: MultiTrackRenderQueueLane[];
  activeJobId: string;
  readinessStatus: MultiTrackRenderQueueReadinessStatus;
  guardrailNotes: string[];
};

export type MultiTrackRenderQueueJobSummary = {
  jobId: string;
  title: string;
  jobKind: MultiTrackRenderQueueJobKind;
  outputFormat: MultiTrackRenderQueueOutputFormat;
  priority: MultiTrackRenderQueuePriority;
  sourceCount: number;
  confidenceBucket: MultiTrackRenderQueueConfidenceBucket;
  readinessStatus: MultiTrackRenderQueueReadinessStatus;
};

export type MultiTrackRenderQueueBatchSummary = {
  batchId: string;
  title: string;
  outputFormat: MultiTrackRenderQueueOutputFormat;
  jobCount: number;
  readyJobCount: number;
  readinessStatus: MultiTrackRenderQueueReadinessStatus;
};

export type MultiTrackRenderQueueReviewPacket = {
  activeJob: MultiTrackRenderQueueJob | null;
  sources: MultiTrackRenderQueueSource[];
  setting: MultiTrackRenderQueueSetting | null;
  risks: MultiTrackRenderQueueRisk[];
  batches: MultiTrackRenderQueueBatch[];
};

export type MultiTrackRenderQueueVersionCoverage = {
  versionId: MultiTrackRenderQueueVersionId;
  jobCount: number;
  outputCount: number;
  strongestJobTitle: string;
  readinessStatus: MultiTrackRenderQueueReadinessStatus;
};

export type MultiTrackRenderQueueValidationResult = {
  isValid: boolean;
  readyCount: number;
  reviewCount: number;
  futureCount: number;
  blockedCount: number;
  messages: string[];
};

export type MultiTrackRenderQueueFilter = {
  searchText: string;
  jobKind: MultiTrackRenderQueueJobKind | "all";
  outputFormat: MultiTrackRenderQueueOutputFormat | "all";
  priority: MultiTrackRenderQueuePriority | "all";
  confidenceBucket: MultiTrackRenderQueueConfidenceBucket | "all";
  readinessStatus: MultiTrackRenderQueueReadinessStatus | "all";
};