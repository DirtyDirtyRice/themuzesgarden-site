export type MultiTrackRenderQueueReadinessStatus =
  | "ready"
  | "needs-review"
  | "blocked"
  | "future";

export type MultiTrackRenderQueueJobStatus =
  | "draft"
  | "prepared"
  | "queued"
  | "rendering"
  | "complete"
  | "failed"
  | "archived";

export type MultiTrackRenderQueueTarget =
  | "keeper-preview"
  | "arrangement-demo"
  | "edit-lane-bounce"
  | "stem-bounce"
  | "full-song-render"
  | "archive-render";

export type MultiTrackRenderQueueFormat =
  | "wav"
  | "mp3"
  | "flac"
  | "aac"
  | "future";

export type MultiTrackRenderQueuePriority =
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "parking-lot";

export type MultiTrackRenderQueueRisk =
  | "missing-audio"
  | "missing-arrangement"
  | "missing-extraction"
  | "unreviewed-section"
  | "format-risk"
  | "timing-risk"
  | "seed-placeholder";

export type MultiTrackRenderQueueCheck = {
  id: string;
  label: string;
  passed: boolean;
  score: number;
  maxScore: number;
  detail: string;
};

export type MultiTrackRenderQueueJob = {
  id: string;
  title: string;
  sourceArrangementId: string;
  target: MultiTrackRenderQueueTarget;
  format: MultiTrackRenderQueueFormat;
  priority: MultiTrackRenderQueuePriority;
  status: MultiTrackRenderQueueJobStatus;
  readinessStatus: MultiTrackRenderQueueReadinessStatus;
  estimatedLengthSeconds: number;
  estimatedFileSizeMb: number;
  renderScore: number;
  qualityScore: number;
  exportScore: number;
  deliveryScore: number;
  checks: MultiTrackRenderQueueCheck[];
  risks: MultiTrackRenderQueueRisk[];
  detail: string;
  notes: string[];
};

export type MultiTrackRenderQueueLane = {
  id: string;
  title: string;
  target: MultiTrackRenderQueueTarget;
  readinessStatus: MultiTrackRenderQueueReadinessStatus;
  jobIds: string[];
  description: string;
};

export type MultiTrackRenderQueuePlanStep = {
  id: string;
  jobId: string;
  order: number;
  label: string;
  status: MultiTrackRenderQueueJobStatus;
  readinessStatus: MultiTrackRenderQueueReadinessStatus;
  detail: string;
};

export type MultiTrackRenderQueueWorkspaceState = {
  id: string;
  title: string;
  description: string;
  readinessStatus: MultiTrackRenderQueueReadinessStatus;
  jobs: MultiTrackRenderQueueJob[];
  lanes: MultiTrackRenderQueueLane[];
  planSteps: MultiTrackRenderQueuePlanStep[];
  notes: string[];
};