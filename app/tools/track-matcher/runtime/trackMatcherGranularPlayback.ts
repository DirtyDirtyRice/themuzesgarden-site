import {
  createTrackMatcherGranularPitchTuning,
  startTrackMatcherGranularPitchEngine,
  type TrackMatcherGranularPitchEngineRuntime,
} from "../trackMatcherGranularPitchEngine";
import type { TrackMatcherProPitchDspPlan } from "../trackMatcherAudioEngine";
import {
  createEmptyGranularLayerState,
  type TrackMatcherProPitchDspNodeLayerState,
  type TrackMatcherProPitchGranularLayerState,
} from "./trackMatcherRuntimeState";

export type StartGranularPlaybackResult = {
  granularLayer: TrackMatcherProPitchGranularLayerState;
  dspNodeLayer: TrackMatcherProPitchDspNodeLayerState;
};

export function createGranularLayerState(
  engine: TrackMatcherGranularPitchEngineRuntime | null,
): TrackMatcherProPitchGranularLayerState {
  if (!engine) {
    return createEmptyGranularLayerState();
  }

  const diagnostics = engine.getDiagnostics();

  return {
    engine,
    diagnostics,
    isActive: true,
    label: diagnostics.label,
    detail: diagnostics.detail,
    warning: diagnostics.warning,
  };
}

export function startGranularPlayback({
  audioContext,
  audioBuffer,
  outputNode,
  dspNodeLayer,
  plan,
  safeTempoRatio,
  safePitchRatio,
  safeStartAt,
}: {
  audioContext: AudioContext;
  audioBuffer: AudioBuffer;
  outputNode: GainNode;
  dspNodeLayer: TrackMatcherProPitchDspNodeLayerState;
  plan: TrackMatcherProPitchDspPlan | null;
  safeTempoRatio: number;
  safePitchRatio: number;
  safeStartAt: number;
}): StartGranularPlaybackResult {
  const granularTuning = createTrackMatcherGranularPitchTuning({
    tempoRatio: safeTempoRatio,
    pitchRatio: safePitchRatio,
    durationSeconds: audioBuffer.duration,
  });

  const granularEngine = startTrackMatcherGranularPitchEngine({
    audioContext,
    audioBuffer,
    outputNode,
    config: {
      tempoRatio: safeTempoRatio,
      pitchRatio: safePitchRatio,
      grainSizeMs: plan?.grainSizeMs ?? granularTuning.grainSizeMs,
      overlapRatio: Math.max(
        plan?.overlapRatio ?? granularTuning.overlapRatio,
        granularTuning.overlapRatio,
      ),
      smoothingMs: plan?.smoothingMs ?? granularTuning.smoothingMs,
      latencyMs: Math.max(
        plan?.latencyMs ?? granularTuning.latencyMs,
        granularTuning.latencyMs,
      ),
      startAtSeconds: safeStartAt,
      durationSeconds: audioBuffer.duration,
      quality: granularTuning.quality,
      windowShape: granularTuning.windowShape,
    },
  });

  const granularLayer = createGranularLayerState(granularEngine);

  return {
    granularLayer,
    dspNodeLayer: {
      ...dspNodeLayer,
      mode: "granular-active",
      label: "Granular DSP node active",
      detail:
        "The DSP insert slot is now hosting the tuned granular pitch engine before final gain output.",
      warning: granularLayer.warning,
    },
  };
}

export function getTrackMatcherProPitchGranularLayerLabel(
  granularLayer: TrackMatcherProPitchGranularLayerState,
) {
  return granularLayer.label;
}

export function getTrackMatcherProPitchGranularLayerDetail(
  granularLayer: TrackMatcherProPitchGranularLayerState,
) {
  const diagnostics = granularLayer.diagnostics;

  if (!granularLayer.isActive) {
    return granularLayer.detail;
  }

  return `${granularLayer.detail} Grains: ${diagnostics.scheduledGrainCount} scheduled, ${diagnostics.activeGrainCount} active. Current buffer time: ${diagnostics.currentBufferTime}s.`;
}
