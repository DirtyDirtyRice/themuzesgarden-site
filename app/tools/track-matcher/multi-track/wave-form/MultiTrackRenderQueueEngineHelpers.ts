import type {
  MultiTrackRenderQueueFormat,
  MultiTrackRenderQueueJob,
  MultiTrackRenderQueueJobStatus,
  MultiTrackRenderQueuePriority,
  MultiTrackRenderQueueReadinessStatus,
  MultiTrackRenderQueueRisk,
  MultiTrackRenderQueueTarget,
  MultiTrackRenderQueueWorkspaceState,
} from "./MultiTrackRenderQueueEngineTypes";

export function getMultiTrackRenderQueueReadinessLabel(
  status: MultiTrackRenderQueueReadinessStatus,
): string {
  if (status === "ready") return "Ready";
  if (status === "needs-review") return "Needs Review";
  if (status === "blocked") return "Blocked";
  return "Future";
}

export function getMultiTrackRenderQueueJobStatusLabel(status: MultiTrackRenderQueueJobStatus): string {
  if (status === "draft") return "Draft";
  if (status === "prepared") return "Prepared";
  if (status === "queued") return "Queued";
  if (status === "rendering") return "Rendering";
  if (status === "complete") return "Complete";
  if (status === "failed") return "Failed";
  return "Archived";
}

export function getMultiTrackRenderQueueTargetLabel(target: MultiTrackRenderQueueTarget): string {
  if (target === "keeper-preview") return "Keeper Preview";
  if (target === "arrangement-demo") return "Arrangement Demo";
  if (target === "edit-lane-bounce") return "Edit Lane Bounce";
  if (target === "stem-bounce") return "Stem Bounce";
  if (target === "full-song-render") return "Full Song Render";
  return "Archive Render";
}

export function getMultiTrackRenderQueueFormatLabel(format: MultiTrackRenderQueueFormat): string {
  if (format === "wav") return "WAV";
  if (format === "mp3") return "MP3";
  if (format === "flac") return "FLAC";
  if (format === "aac") return "AAC";
  return "Future";
}

export function getMultiTrackRenderQueuePriorityLabel(priority: MultiTrackRenderQueuePriority): string {
  if (priority === "critical") return "Critical";
  if (priority === "high") return "High";
  if (priority === "medium") return "Medium";
  if (priority === "low") return "Low";
  return "Parking Lot";
}

export function getMultiTrackRenderQueueRiskLabel(risk: MultiTrackRenderQueueRisk): string {
  if (risk === "missing-audio") return "Missing Audio";
  if (risk === "missing-arrangement") return "Missing Arrangement";
  if (risk === "missing-extraction") return "Missing Extraction";
  if (risk === "unreviewed-section") return "Unreviewed Section";
  if (risk === "format-risk") return "Format Risk";
  if (risk === "timing-risk") return "Timing Risk";
  return "Seed Placeholder";
}

export function getMultiTrackRenderQueueComputedScore(job: MultiTrackRenderQueueJob): number {
  const checkAverage =
    job.checks.length > 0
      ? job.checks.reduce((total, check) => {
          if (check.maxScore <= 0) return total;
          return total + check.score / check.maxScore;
        }, 0) / job.checks.length
      : 0;

  const passedRatio =
    job.checks.length > 0 ? job.checks.filter((check) => check.passed).length / job.checks.length : 0;

  const priorityBoost = getMultiTrackRenderQueuePriorityBoost(job.priority);
  const statusBoost = getMultiTrackRenderQueueStatusBoost(job.status);
  const readinessBoost = getMultiTrackRenderQueueReadinessBoost(job.readinessStatus);
  const riskPenalty = Math.min(job.risks.length * 5, 22);

  return Math.round(
    job.renderScore * 0.26 +
      job.qualityScore * 0.22 +
      job.exportScore * 0.18 +
      job.deliveryScore * 0.12 +
      checkAverage * 100 * 0.1 +
      passedRatio * 100 * 0.04 +
      priorityBoost * 100 * 0.04 +
      statusBoost * 100 * 0.02 +
      readinessBoost * 100 * 0.02 -
      riskPenalty,
  );
}

export function sortMultiTrackRenderQueueJobsByScore(
  jobs: MultiTrackRenderQueueJob[],
): MultiTrackRenderQueueJob[] {
  return [...jobs].sort(
    (left, right) => getMultiTrackRenderQueueComputedScore(right) - getMultiTrackRenderQueueComputedScore(left),
  );
}

export function sortMultiTrackRenderQueueJobsByPriority(
  jobs: MultiTrackRenderQueueJob[],
): MultiTrackRenderQueueJob[] {
  return [...jobs].sort(
    (left, right) =>
      getMultiTrackRenderQueuePriorityValue(right.priority) - getMultiTrackRenderQueuePriorityValue(left.priority),
  );
}

export function getMultiTrackRenderQueueBestJob(
  jobs: MultiTrackRenderQueueJob[],
): MultiTrackRenderQueueJob | undefined {
  return sortMultiTrackRenderQueueJobsByScore(jobs)[0];
}

export function getMultiTrackRenderQueueJobsByStatus(
  jobs: MultiTrackRenderQueueJob[],
  status: MultiTrackRenderQueueJobStatus,
): MultiTrackRenderQueueJob[] {
  return jobs.filter((job) => job.status === status);
}

export function getMultiTrackRenderQueueJobsByReadiness(
  jobs: MultiTrackRenderQueueJob[],
  readinessStatus: MultiTrackRenderQueueReadinessStatus,
): MultiTrackRenderQueueJob[] {
  return jobs.filter((job) => job.readinessStatus === readinessStatus);
}

export function getMultiTrackRenderQueueJobsByTarget(
  jobs: MultiTrackRenderQueueJob[],
  target: MultiTrackRenderQueueTarget,
): MultiTrackRenderQueueJob[] {
  return jobs.filter((job) => job.target === target);
}

export function getMultiTrackRenderQueueLaneJobs(
  state: MultiTrackRenderQueueWorkspaceState,
  laneId: string,
): MultiTrackRenderQueueJob[] {
  const lane = state.lanes.find((item) => item.id === laneId);
  if (!lane) return [];

  return lane.jobIds
    .map((jobId) => state.jobs.find((job) => job.id === jobId))
    .filter((job): job is MultiTrackRenderQueueJob => Boolean(job));
}

export function getMultiTrackRenderQueueJobTitle(
  state: MultiTrackRenderQueueWorkspaceState,
  jobId: string,
): string {
  return state.jobs.find((job) => job.id === jobId)?.title ?? "Unknown render job";
}

export function getMultiTrackRenderQueuePassedCheckCount(job: MultiTrackRenderQueueJob): number {
  return job.checks.filter((check) => check.passed).length;
}

export function getMultiTrackRenderQueueTotalEstimatedFileSizeMb(jobs: MultiTrackRenderQueueJob[]): number {
  return jobs.reduce((total, job) => total + job.estimatedFileSizeMb, 0);
}

export function getMultiTrackRenderQueueTotalEstimatedLengthSeconds(jobs: MultiTrackRenderQueueJob[]): number {
  return jobs.reduce((total, job) => total + job.estimatedLengthSeconds, 0);
}

export function formatMultiTrackRenderQueueDuration(seconds: number): string {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;

  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

export function getMultiTrackRenderQueueWorkspaceSummary(
  state: MultiTrackRenderQueueWorkspaceState,
): {
  jobCount: number;
  readyCount: number;
  reviewCount: number;
  queuedCount: number;
  preparedCount: number;
  wavCount: number;
  totalSizeMb: number;
  totalLengthSeconds: number;
  bestJobTitle: string;
  bestJobScore: number;
} {
  const bestJob = getMultiTrackRenderQueueBestJob(state.jobs);

  return {
    jobCount: state.jobs.length,
    readyCount: getMultiTrackRenderQueueJobsByReadiness(state.jobs, "ready").length,
    reviewCount: getMultiTrackRenderQueueJobsByReadiness(state.jobs, "needs-review").length,
    queuedCount: getMultiTrackRenderQueueJobsByStatus(state.jobs, "queued").length,
    preparedCount: getMultiTrackRenderQueueJobsByStatus(state.jobs, "prepared").length,
    wavCount: state.jobs.filter((job) => job.format === "wav").length,
    totalSizeMb: getMultiTrackRenderQueueTotalEstimatedFileSizeMb(state.jobs),
    totalLengthSeconds: getMultiTrackRenderQueueTotalEstimatedLengthSeconds(state.jobs),
    bestJobTitle: bestJob?.title ?? "No render job",
    bestJobScore: bestJob ? getMultiTrackRenderQueueComputedScore(bestJob) : 0,
  };
}

function getMultiTrackRenderQueuePriorityValue(priority: MultiTrackRenderQueuePriority): number {
  if (priority === "critical") return 5;
  if (priority === "high") return 4;
  if (priority === "medium") return 3;
  if (priority === "low") return 2;
  return 1;
}

function getMultiTrackRenderQueuePriorityBoost(priority: MultiTrackRenderQueuePriority): number {
  if (priority === "critical") return 1;
  if (priority === "high") return 0.82;
  if (priority === "medium") return 0.6;
  if (priority === "low") return 0.34;
  return 0.18;
}

function getMultiTrackRenderQueueStatusBoost(status: MultiTrackRenderQueueJobStatus): number {
  if (status === "complete") return 1;
  if (status === "rendering") return 0.86;
  if (status === "queued") return 0.78;
  if (status === "prepared") return 0.72;
  if (status === "draft") return 0.42;
  if (status === "archived") return 0.18;
  return 0;
}

function getMultiTrackRenderQueueReadinessBoost(status: MultiTrackRenderQueueReadinessStatus): number {
  if (status === "ready") return 1;
  if (status === "needs-review") return 0.58;
  if (status === "future") return 0.32;
  return 0;
}