import { roundTo } from "./granularPitchMath";
import { normalizeConfig } from "./granularPitchConfig";
import { getGranularPitchScheduleMetrics } from "./granularPitchScheduler";
import type { TrackMatcherGranularPitchEngineConfig } from "./granularPitchTypes";

export type GranularPitchOfflinePlanGrain = {
  index: number;
  contextTime: number;
  sourceOffset: number;
  duration: number;
};

export type GranularPitchOfflinePlan = {
  config: TrackMatcherGranularPitchEngineConfig;
  grainCount: number;
  grainSpacingSeconds: number;
  grainDurationSeconds: number;
  estimatedLatencyMs: number;
  grains: GranularPitchOfflinePlanGrain[];
};

export function estimateGranularPitchLatencyMs(
  config: Partial<TrackMatcherGranularPitchEngineConfig> = {},
) {
  const normalized = normalizeConfig(config);

  return roundTo(
    normalized.scheduleAheadMs + normalized.grainSizeMs * 0.5,
    2,
  );
}

export function createGranularPitchEngineOfflinePlan({
  duration,
  config,
}: {
  duration: number;
  config?: Partial<TrackMatcherGranularPitchEngineConfig>;
}): GranularPitchOfflinePlan {
  const normalized = normalizeConfig(config);
  const metrics = getGranularPitchScheduleMetrics(normalized);
  const safeDuration = Math.max(0, duration);
  const grains: GranularPitchOfflinePlanGrain[] = [];

  let contextTime = 0;
  let sourceOffset = 0;
  let index = 0;

  while (contextTime < safeDuration) {
    grains.push({
      index,
      contextTime: roundTo(contextTime, 4),
      sourceOffset: roundTo(sourceOffset, 4),
      duration: roundTo(metrics.grainDurationSeconds, 4),
    });

    contextTime += metrics.grainSpacingSeconds;
    sourceOffset += metrics.grainSpacingSeconds * normalized.tempoRatio;
    index += 1;

    if (index > 20000) break;
  }

  return {
    config: normalized,
    grainCount: grains.length,
    grainSpacingSeconds: roundTo(metrics.grainSpacingSeconds, 4),
    grainDurationSeconds: roundTo(metrics.grainDurationSeconds, 4),
    estimatedLatencyMs: estimateGranularPitchLatencyMs(normalized),
    grains,
  };
}