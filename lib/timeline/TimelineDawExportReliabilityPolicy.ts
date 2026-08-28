import type { TimelineOfflineRenderJob } from "./TimelineOfflineRenderAndExportEngine";

export const TIMELINE_DAW_SAFE_EXPORT_BYTES = 512 * 1024 * 1024;

export type TimelineDawExportPreflight = {
  safe: boolean;
  estimatedBytes: number;
  estimatedMegabytes: number;
  maximumSafeFrames: number;
  maximumSafeDurationSeconds: number;
  outputCount: number;
  message: string;
};

export function evaluateTimelineDawExportPreflight(
  job: Pick<TimelineOfflineRenderJob, "bitDepth" | "channels" | "format" | "sampleRate" | "sourceIds" | "target" | "totalFrames">,
  safeByteLimit = TIMELINE_DAW_SAFE_EXPORT_BYTES,
): TimelineDawExportPreflight {
  const bytesPerSample = job.bitDepth === 32 ? 4 : job.bitDepth / 8;
  const outputCount = job.target === "stem" ? Math.max(1, job.sourceIds.length) : 1;
  const headerBytes = job.format === "wav" ? 44 * outputCount : 0;
  const zipOverheadBytes = job.target === "stem" ? 256 * outputCount + 64 : 0;
  const bytesPerFrame = job.channels * bytesPerSample * outputCount;
  const estimatedBytes = Math.ceil(headerBytes + zipOverheadBytes + job.totalFrames * bytesPerFrame);
  const maximumSafeFrames = Math.max(0, Math.floor((safeByteLimit - headerBytes - zipOverheadBytes) / bytesPerFrame));
  const maximumSafeDurationSeconds = maximumSafeFrames / job.sampleRate;
  const estimatedMegabytes = estimatedBytes / 1024 / 1024;
  const safe = estimatedBytes <= safeByteLimit;
  const label = job.target === "stem" ? `${outputCount}-stem ZIP` : "audio delivery";
  return {
    safe,
    estimatedBytes,
    estimatedMegabytes,
    maximumSafeFrames,
    maximumSafeDurationSeconds,
    outputCount,
    message: safe
      ? `Estimated ${label}: ${estimatedMegabytes.toFixed(1)} MB.`
      : `Estimated ${label}: ${estimatedMegabytes.toFixed(1)} MB. Reduce the export to ${formatDuration(maximumSafeDurationSeconds)} or less before rendering.`,
  };
}

function formatDuration(seconds: number) {
  const wholeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(wholeSeconds / 60);
  return `${minutes}:${String(wholeSeconds % 60).padStart(2, "0")}`;
}
