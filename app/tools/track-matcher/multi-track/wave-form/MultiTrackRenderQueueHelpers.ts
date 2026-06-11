import type {
  MultiTrackRenderQueueBatch,
  MultiTrackRenderQueueBatchSummary,
  MultiTrackRenderQueueConfidenceBucket,
  MultiTrackRenderQueueFilter,
  MultiTrackRenderQueueJob,
  MultiTrackRenderQueueJobKind,
  MultiTrackRenderQueueJobSummary,
  MultiTrackRenderQueueOutputFormat,
  MultiTrackRenderQueueReadinessStatus,
  MultiTrackRenderQueueReviewPacket,
  MultiTrackRenderQueueRisk,
  MultiTrackRenderQueueSetting,
  MultiTrackRenderQueueSource,
  MultiTrackRenderQueueValidationResult,
  MultiTrackRenderQueueVersionCoverage,
  MultiTrackRenderQueueVersionId,
  MultiTrackRenderQueueWorkspaceState,
} from "./MultiTrackRenderQueueTypes";

export function getMultiTrackRenderQueueReadinessLabel(
  status: MultiTrackRenderQueueReadinessStatus,
): string {
  if (status === "ready") return "Ready";
  if (status === "needs-review") return "Needs Review";
  if (status === "blocked") return "Blocked";
  return "Future";
}

export function getMultiTrackRenderQueueConfidenceLabel(
  bucket: MultiTrackRenderQueueConfidenceBucket,
): string {
  if (bucket === "verified") return "Verified";
  if (bucket === "strong") return "Strong";
  if (bucket === "moderate") return "Moderate";
  if (bucket === "weak") return "Weak";
  if (bucket === "blocked") return "Blocked";
  return "Unknown";
}

export function getMultiTrackRenderQueueJobKindLabel(
  kind: MultiTrackRenderQueueJobKind,
): string {
  if (kind === "hook-render") return "Hook Render";
  if (kind === "riff-render") return "Riff Render";
  if (kind === "bass-loop-render") return "Bass Loop Render";
  if (kind === "vocal-phrase-render") return "Vocal Phrase Render";
  if (kind === "hybrid-section-render") return "Hybrid Section Render";
  if (kind === "stem-export") return "Stem Export";
  if (kind === "comparison-export") return "Comparison Export";
  return "Archive Export";
}

export function getMultiTrackRenderQueueOutputLabel(
  outputFormat: MultiTrackRenderQueueOutputFormat,
): string {
  if (outputFormat === "wav") return "WAV";
  if (outputFormat === "mp3") return "MP3";
  if (outputFormat === "stem-pack") return "Stem Pack";
  if (outputFormat === "clip-pack") return "Clip Pack";
  return "Future Session";
}

export function formatMultiTrackRenderQueueSeconds(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function formatMultiTrackRenderQueueRange(
  startSeconds: number,
  endSeconds: number,
): string {
  return `${formatMultiTrackRenderQueueSeconds(
    startSeconds,
  )} - ${formatMultiTrackRenderQueueSeconds(endSeconds)}`;
}

export function findMultiTrackRenderQueueJobById(
  state: MultiTrackRenderQueueWorkspaceState,
  jobId: string,
): MultiTrackRenderQueueJob | null {
  return state.jobs.find((job) => job.id === jobId) ?? null;
}

export function findMultiTrackRenderQueueSourceById(
  state: MultiTrackRenderQueueWorkspaceState,
  sourceId: string,
): MultiTrackRenderQueueSource | null {
  return state.sources.find((source) => source.id === sourceId) ?? null;
}

export function findMultiTrackRenderQueueSettingById(
  state: MultiTrackRenderQueueWorkspaceState,
  settingId: string,
): MultiTrackRenderQueueSetting | null {
  return state.settings.find((setting) => setting.id === settingId) ?? null;
}

export function getMultiTrackRenderQueueSourcesForJob(
  state: MultiTrackRenderQueueWorkspaceState,
  job: MultiTrackRenderQueueJob,
): MultiTrackRenderQueueSource[] {
  return job.sourceIds
    .map((sourceId) => findMultiTrackRenderQueueSourceById(state, sourceId))
    .filter((source): source is MultiTrackRenderQueueSource => Boolean(source));
}

export function getMultiTrackRenderQueueRisksForJob(
  state: MultiTrackRenderQueueWorkspaceState,
  job: MultiTrackRenderQueueJob,
): MultiTrackRenderQueueRisk[] {
  return job.riskIds
    .map((riskId) => state.risks.find((risk) => risk.id === riskId))
    .filter((risk): risk is MultiTrackRenderQueueRisk => Boolean(risk));
}

export function getMultiTrackRenderQueueBatchesForJob(
  state: MultiTrackRenderQueueWorkspaceState,
  jobId: string,
): MultiTrackRenderQueueBatch[] {
  return state.batches.filter((batch) => batch.jobIds.includes(jobId));
}

export function buildMultiTrackRenderQueueReviewPacket(
  state: MultiTrackRenderQueueWorkspaceState,
  jobId: string,
): MultiTrackRenderQueueReviewPacket {
  const activeJob = findMultiTrackRenderQueueJobById(state, jobId);

  if (!activeJob) {
    return {
      activeJob: null,
      sources: [],
      setting: null,
      risks: [],
      batches: [],
    };
  }

  return {
    activeJob,
    sources: getMultiTrackRenderQueueSourcesForJob(state, activeJob),
    setting: findMultiTrackRenderQueueSettingById(state, activeJob.settingId),
    risks: getMultiTrackRenderQueueRisksForJob(state, activeJob),
    batches: getMultiTrackRenderQueueBatchesForJob(state, activeJob.id),
  };
}

export function buildMultiTrackRenderQueueJobSummaries(
  state: MultiTrackRenderQueueWorkspaceState,
): MultiTrackRenderQueueJobSummary[] {
  return state.jobs.map((job) => {
    const setting = findMultiTrackRenderQueueSettingById(state, job.settingId);

    return {
      jobId: job.id,
      title: job.title,
      jobKind: job.jobKind,
      outputFormat: setting?.outputFormat ?? "future-session",
      priority: job.priority,
      sourceCount: job.sourceIds.length,
      confidenceBucket: job.confidenceBucket,
      readinessStatus: job.readinessStatus,
    };
  });
}

export function buildMultiTrackRenderQueueBatchSummaries(
  state: MultiTrackRenderQueueWorkspaceState,
): MultiTrackRenderQueueBatchSummary[] {
  return state.batches.map((batch) => {
    const readyJobCount = batch.jobIds.filter((jobId) => {
      const job = findMultiTrackRenderQueueJobById(state, jobId);
      return job?.readinessStatus === "ready";
    }).length;

    return {
      batchId: batch.id,
      title: batch.title,
      outputFormat: batch.outputFormat,
      jobCount: batch.jobIds.length,
      readyJobCount,
      readinessStatus: batch.readinessStatus,
    };
  });
}

export function buildMultiTrackRenderQueueVersionCoverage(
  state: MultiTrackRenderQueueWorkspaceState,
): MultiTrackRenderQueueVersionCoverage[] {
  const versionIds: MultiTrackRenderQueueVersionId[] = [
    "version-01",
    "version-02",
    "version-03",
    "version-04",
    "version-05",
    "version-06",
    "version-07",
    "version-08",
    "version-09",
    "version-10",
  ];

  return versionIds.map((versionId) => {
    const sources = state.sources.filter(
      (source) => source.versionId === versionId,
    );
    const sourceIds = new Set(sources.map((source) => source.id));
    const jobs = state.jobs.filter((job) =>
      job.sourceIds.some((sourceId) => sourceIds.has(sourceId)),
    );

    const strongestJob = [...jobs].sort(
      (firstJob, secondJob) =>
        getMultiTrackRenderQueueConfidenceScore(secondJob.confidenceBucket) -
        getMultiTrackRenderQueueConfidenceScore(firstJob.confidenceBucket),
    )[0];

    return {
      versionId,
      jobCount: jobs.length,
      outputCount: jobs.length,
      strongestJobTitle: strongestJob?.title ?? "No render job yet",
      readinessStatus:
        strongestJob?.readinessStatus ??
        (sources.length > 0 ? "needs-review" : "future"),
    };
  });
}

export function getMultiTrackRenderQueueConfidenceScore(
  bucket: MultiTrackRenderQueueConfidenceBucket,
): number {
  if (bucket === "verified") return 100;
  if (bucket === "strong") return 85;
  if (bucket === "moderate") return 65;
  if (bucket === "weak") return 35;
  if (bucket === "blocked") return 0;
  return 10;
}

export function filterMultiTrackRenderQueueJobs(
  jobs: MultiTrackRenderQueueJob[],
  filter: MultiTrackRenderQueueFilter,
  state: MultiTrackRenderQueueWorkspaceState,
): MultiTrackRenderQueueJob[] {
  const searchText = filter.searchText.trim().toLowerCase();

  return jobs.filter((job) => {
    const setting = findMultiTrackRenderQueueSettingById(state, job.settingId);

    const matchesSearch =
      searchText.length === 0 ||
      job.title.toLowerCase().includes(searchText) ||
      job.outputName.toLowerCase().includes(searchText) ||
      job.destinationLabel.toLowerCase().includes(searchText);

    const matchesKind = filter.jobKind === "all" || job.jobKind === filter.jobKind;

    const matchesOutput =
      filter.outputFormat === "all" ||
      setting?.outputFormat === filter.outputFormat;

    const matchesPriority =
      filter.priority === "all" || job.priority === filter.priority;

    const matchesConfidence =
      filter.confidenceBucket === "all" ||
      job.confidenceBucket === filter.confidenceBucket;

    const matchesReadiness =
      filter.readinessStatus === "all" ||
      job.readinessStatus === filter.readinessStatus;

    return (
      matchesSearch &&
      matchesKind &&
      matchesOutput &&
      matchesPriority &&
      matchesConfidence &&
      matchesReadiness
    );
  });
}

export function validateMultiTrackRenderQueueState(
  state: MultiTrackRenderQueueWorkspaceState,
): MultiTrackRenderQueueValidationResult {
  const messages: string[] = [];
  const sourceIds = new Set(state.sources.map((source) => source.id));
  const settingIds = new Set(state.settings.map((setting) => setting.id));
  const riskIds = new Set(state.risks.map((risk) => risk.id));
  const jobIds = new Set(state.jobs.map((job) => job.id));

  state.jobs.forEach((job) => {
    job.sourceIds.forEach((sourceId) => {
      if (!sourceIds.has(sourceId)) {
        messages.push(`Missing source ${sourceId} for job ${job.id}`);
      }
    });

    if (!settingIds.has(job.settingId)) {
      messages.push(`Missing setting ${job.settingId} for job ${job.id}`);
    }

    job.riskIds.forEach((riskId) => {
      if (!riskIds.has(riskId)) {
        messages.push(`Missing risk ${riskId} for job ${job.id}`);
      }
    });
  });

  state.batches.forEach((batch) => {
    batch.jobIds.forEach((jobId) => {
      if (!jobIds.has(jobId)) {
        messages.push(`Missing job ${jobId} for batch ${batch.id}`);
      }
    });
  });

  state.lanes.forEach((lane) => {
    lane.jobIds.forEach((jobId) => {
      if (!jobIds.has(jobId)) {
        messages.push(`Missing job ${jobId} for lane ${lane.id}`);
      }
    });
  });

  const readyCount = state.jobs.filter(
    (job) => job.readinessStatus === "ready",
  ).length;

  const reviewCount = state.jobs.filter(
    (job) => job.readinessStatus === "needs-review",
  ).length;

  const futureCount = state.jobs.filter(
    (job) => job.readinessStatus === "future",
  ).length;

  const blockedCount = state.jobs.filter(
    (job) => job.readinessStatus === "blocked",
  ).length;

  return {
    isValid: messages.length === 0,
    readyCount,
    reviewCount,
    futureCount,
    blockedCount,
    messages,
  };
}