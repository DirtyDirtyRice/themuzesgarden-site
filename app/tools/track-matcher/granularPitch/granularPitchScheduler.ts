import { msFromSeconds, safeModulo, secondsFromMs } from "./granularPitchMath";
import type { TrackMatcherGranularPitchEngineConfig } from "./granularPitchTypes";

export type GranularPitchScheduleMetrics = {
  grainDurationSeconds: number;
  grainSpacingSeconds: number;
  grainSpacingMs: number;
  scheduleAheadSeconds: number;
  scheduleAheadMs: number;
};

export type GranularPitchSchedulerCursor = {
  nextGrainContextTime: number;
  nextGrainOffset: number;
};

export function getGranularPitchScheduleMetrics(
  config: TrackMatcherGranularPitchEngineConfig,
): GranularPitchScheduleMetrics {
  const grainDurationSeconds = secondsFromMs(config.grainSizeMs);
  const overlapRatio = Math.min(0.92, Math.max(0, config.overlapRatio));
  const grainSpacingSeconds = Math.max(
    0.006,
    grainDurationSeconds * (1 - overlapRatio),
  );

  return {
    grainDurationSeconds,
    grainSpacingSeconds,
    grainSpacingMs: msFromSeconds(grainSpacingSeconds),
    scheduleAheadSeconds: secondsFromMs(config.scheduleAheadMs),
    scheduleAheadMs: config.scheduleAheadMs,
  };
}

export function createGranularPitchSchedulerCursor({
  contextTime,
  offset,
}: {
  contextTime: number;
  offset: number;
}): GranularPitchSchedulerCursor {
  return {
    nextGrainContextTime: contextTime + 0.012,
    nextGrainOffset: Math.max(0, offset),
  };
}

export function advanceGranularPitchSchedulerCursor({
  cursor,
  config,
  bufferDuration,
}: {
  cursor: GranularPitchSchedulerCursor;
  config: TrackMatcherGranularPitchEngineConfig;
  bufferDuration: number;
}): GranularPitchSchedulerCursor {
  const metrics = getGranularPitchScheduleMetrics(config);
  const nextOffset =
    cursor.nextGrainOffset + metrics.grainSpacingSeconds * config.tempoRatio;

  return {
    nextGrainContextTime:
      cursor.nextGrainContextTime + metrics.grainSpacingSeconds,
    nextGrainOffset: safeModulo(nextOffset, bufferDuration),
  };
}

export function shouldScheduleNextGrain({
  contextTime,
  cursor,
  config,
}: {
  contextTime: number;
  cursor: GranularPitchSchedulerCursor;
  config: TrackMatcherGranularPitchEngineConfig;
}) {
  const metrics = getGranularPitchScheduleMetrics(config);
  return cursor.nextGrainContextTime < contextTime + metrics.scheduleAheadSeconds;
}