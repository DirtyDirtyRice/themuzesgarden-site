import { clamp } from "./granularPitchMath";
import type { TrackMatcherGranularPitchEngineConfig } from "./granularPitchTypes";

export const DEFAULT_CONFIG: TrackMatcherGranularPitchEngineConfig = {
  tempoRatio: 1,
  pitchRatio: 1,
  grainSizeMs: 90,
  overlapRatio: 0.65,
  scheduleAheadMs: 180,
  crossfadeMs: 20,
  maxActiveGrains: 36,
};

export function normalizeConfig(
  config?: Partial<TrackMatcherGranularPitchEngineConfig>
): TrackMatcherGranularPitchEngineConfig {
  const merged = {
    ...DEFAULT_CONFIG,
    ...(config ?? {}),
  };

  return {
    tempoRatio: clamp(merged.tempoRatio, 0.25, 4),
    pitchRatio: clamp(merged.pitchRatio, 0.25, 4),
    grainSizeMs: clamp(merged.grainSizeMs, 20, 280),
    overlapRatio: clamp(merged.overlapRatio, 0, 0.92),
    scheduleAheadMs: clamp(merged.scheduleAheadMs, 40, 700),
    crossfadeMs: clamp(merged.crossfadeMs, 2, 100),
    maxActiveGrains: Math.round(clamp(merged.maxActiveGrains, 4, 96)),
  };
}