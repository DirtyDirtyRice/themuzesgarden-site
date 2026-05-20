"use client";

import { normalizeConfig } from "./granularPitch/granularPitchConfig";
import { createGranularPitchDiagnostics } from "./granularPitch/granularPitchDiagnostics";
import { createGranularPitchCoreEngine } from "./granularPitch/granularPitchCoreEngine";
import {
  createGranularPitchEngineOfflinePlan,
  estimateGranularPitchLatencyMs,
} from "./granularPitch/granularPitchOfflinePlan";
import { getPitchRatioFromSemitones } from "./granularPitch/granularPitchMath";
import { getGranularPitchScheduleMetrics } from "./granularPitch/granularPitchScheduler";
import type {
  TrackMatcherGranularPitchEngineDiagnostics,
} from "./granularPitch/granularPitchTypes";
import type { TrackMatcherProPitchDspPlan } from "./trackMatcherAudioEngine";

export type {
  TrackMatcherGranularPitchEngineConfig,
  TrackMatcherGranularPitchEngineDiagnostics,
} from "./granularPitch/granularPitchTypes";

export type TrackMatcherGranularPitchEngineRuntime = {
  stop: () => TrackMatcherGranularPitchEngineDiagnostics;
  pause: () => TrackMatcherGranularPitchEngineDiagnostics;
  seek: (time: number) => TrackMatcherGranularPitchEngineDiagnostics;
  dispose: () => TrackMatcherGranularPitchEngineDiagnostics;
  getDiagnostics: () => TrackMatcherGranularPitchEngineDiagnostics;
  getCurrentBufferTime: () => number;
};

type TrackMatcherGranularPitchPlanLike = Partial<TrackMatcherProPitchDspPlan> & {
  tempoRatio?: number;
  pitchRatio?: number;
  keyShiftSemitones?: number;
  bpm?: number;
  baseBpm?: number;
  durationSeconds?: number;
  audioBuffer?: AudioBuffer | null;
  grainSizeMs?: number;
  overlapRatio?: number;
  smoothingMs?: number;
  latencyMs?: number;
  startAtSeconds?: number;
  quality?: string;
  windowShape?: string;
};

type StartTrackMatcherGranularPitchEngineInput = {
  context?: AudioContext;
  audioContext?: AudioContext;
  audioBuffer: AudioBuffer;
  plan?: TrackMatcherProPitchDspPlan | TrackMatcherGranularPitchPlanLike | null;
  config?: TrackMatcherGranularPitchPlanLike | null;
  output?: AudioNode | null;
  outputNode?: AudioNode | null;
  onDiagnostics?: (
    diagnostics: TrackMatcherGranularPitchEngineDiagnostics,
  ) => void;
};

function getPlanTempoRatio(plan: TrackMatcherGranularPitchPlanLike | null) {
  const tempoRatio = plan?.tempoRatio;
  const bpm = plan?.bpm;
  const baseBpm = plan?.baseBpm;

  if (Number.isFinite(tempoRatio) && tempoRatio !== undefined) {
    return tempoRatio;
  }

  if (
    Number.isFinite(bpm) &&
    Number.isFinite(baseBpm) &&
    bpm !== undefined &&
    baseBpm !== undefined &&
    baseBpm > 0
  ) {
    return bpm / baseBpm;
  }

  return 1;
}

function getPlanPitchRatio(plan: TrackMatcherGranularPitchPlanLike | null) {
  const pitchRatio = plan?.pitchRatio;
  const keyShiftSemitones = plan?.keyShiftSemitones;

  if (Number.isFinite(pitchRatio) && pitchRatio !== undefined) {
    return pitchRatio;
  }

  if (
    Number.isFinite(keyShiftSemitones) &&
    keyShiftSemitones !== undefined
  ) {
    return getPitchRatioFromSemitones(keyShiftSemitones);
  }

  return 1;
}

function getPlanKeyShiftSemitones(plan: TrackMatcherGranularPitchPlanLike | null) {
  const keyShiftSemitones = plan?.keyShiftSemitones;
  const pitchRatio = plan?.pitchRatio;

  if (
    Number.isFinite(keyShiftSemitones) &&
    keyShiftSemitones !== undefined
  ) {
    return keyShiftSemitones;
  }

  if (
    Number.isFinite(pitchRatio) &&
    pitchRatio !== undefined &&
    pitchRatio > 0
  ) {
    return 12 * Math.log2(pitchRatio);
  }

  return 0;
}

function createConfigFromPlan(
  plan: TrackMatcherGranularPitchPlanLike | null,
) {
  return normalizeConfig({
    tempoRatio: getPlanTempoRatio(plan),
    pitchRatio: getPlanPitchRatio(plan),
    grainSizeMs: plan?.grainSizeMs,
    overlapRatio: plan?.overlapRatio,
    scheduleAheadMs: plan?.latencyMs,
    crossfadeMs: plan?.smoothingMs,
  });
}

export function createDefaultTrackMatcherGranularPitchEngineConfig() {
  return normalizeConfig();
}

export function createStoppedTrackMatcherGranularPitchDiagnostics(
  plan?: TrackMatcherProPitchDspPlan | TrackMatcherGranularPitchPlanLike | null,
): TrackMatcherGranularPitchEngineDiagnostics {
  const config = plan ? createConfigFromPlan(plan) : normalizeConfig();
  const metrics = getGranularPitchScheduleMetrics(config);

  return createGranularPitchDiagnostics({
    status: "stopped",
    mode: "pro-pitch",
    config,
    grainSpacingMs: metrics.grainSpacingMs,
    scheduleAheadMs: metrics.scheduleAheadMs,
    scheduledGrainCount: 0,
    activeGrainCount: 0,
    currentBufferTime: 0,
    startedAtContextTime: 0,
    error: "",
  });
}

export function createTrackMatcherGranularPitchTuning(
  plan: TrackMatcherGranularPitchPlanLike,
) {
  const tempoRatio = getPlanTempoRatio(plan);
  const pitchRatio = getPlanPitchRatio(plan);
  const keyShiftSemitones = getPlanKeyShiftSemitones(plan);
  const durationSeconds =
    plan.durationSeconds ?? plan.audioBuffer?.duration ?? 0;

  return {
    tempoRatio,
    pitchRatio,
    keyShiftSemitones,
    playbackRate: tempoRatio * pitchRatio,
    grainSizeMs: plan.grainSizeMs ?? 90,
    overlapRatio: plan.overlapRatio ?? 0.65,
    smoothingMs: plan.smoothingMs ?? 20,
    latencyMs: plan.latencyMs ?? 180,
    durationSeconds,
    quality: plan.quality ?? "foundation",
    windowShape: plan.windowShape ?? "hann",
    label: `Tempo ${tempoRatio.toFixed(3)}× · Pitch ${
      keyShiftSemitones >= 0 ? "+" : ""
    }${keyShiftSemitones.toFixed(2)} st`,
    detail:
      "Granular pitch engine separates tempo scheduling from source pitch playback.",
  };
}

export function shouldUseTrackMatcherGranularPitchEngine(
  plan: TrackMatcherGranularPitchPlanLike | null,
) {
  if (!plan) return false;

  const pitchRatio = getPlanPitchRatio(plan);
  const hasAudio =
    !("audioBuffer" in plan) ||
    plan.audioBuffer === undefined ||
    plan.audioBuffer !== null;

  return hasAudio && Math.abs(pitchRatio - 1) > 0.001;
}

export function startTrackMatcherGranularPitchEngine({
  context,
  audioContext,
  audioBuffer,
  plan,
  config,
  output,
  outputNode,
  onDiagnostics,
}: StartTrackMatcherGranularPitchEngineInput): TrackMatcherGranularPitchEngineRuntime {
  const resolvedContext = context ?? audioContext;

  if (!resolvedContext) {
    const diagnostics = createStoppedTrackMatcherGranularPitchDiagnostics(plan);

    return {
      stop: () => diagnostics,
      pause: () => diagnostics,
      seek: () => diagnostics,
      dispose: () => diagnostics,
      getDiagnostics: () => diagnostics,
      getCurrentBufferTime: () => 0,
    };
  }

  const mergedConfig = normalizeConfig({
    ...createConfigFromPlan(plan ?? null),
    ...(config ?? {}),
  });

  const engine = createGranularPitchCoreEngine({
    context: resolvedContext,
    buffer: audioBuffer,
    output: output ?? outputNode ?? null,
    mode: "pro-pitch",
    config: mergedConfig,
    onDiagnostics,
  });

  engine.start(config?.startAtSeconds ?? 0);

  return {
    stop: engine.stop,
    pause: engine.pause,
    seek: engine.seek,
    dispose: engine.dispose,
    getDiagnostics: engine.getDiagnostics,
    getCurrentBufferTime: () => engine.getDiagnostics().currentBufferTime,
  };
}

export {
  createGranularPitchEngineOfflinePlan,
  estimateGranularPitchLatencyMs,
};

export type TrackMatcherGranularPitchEngine = ReturnType<
  typeof createGranularPitchCoreEngine
>;