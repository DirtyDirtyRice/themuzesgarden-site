import {
  createStoppedTrackMatcherGranularPitchDiagnostics,
  type TrackMatcherGranularPitchEngineDiagnostics,
  type TrackMatcherGranularPitchEngineRuntime,
} from "../trackMatcherGranularPitchEngine";
import type { TrackMatcherProPitchDspPlan } from "../trackMatcherAudioEngine";

export type TrackMatcherProPitchRuntimeStatus =
  | "idle"
  | "unsupported"
  | "loading"
  | "ready"
  | "playing"
  | "paused"
  | "stopped"
  | "failed";

export type TrackMatcherProPitchLayerMode =
  | "none"
  | "tempo-only"
  | "audible-rate-pitch"
  | "future-granular-pitch";

export type TrackMatcherProPitchLayerState = {
  mode: TrackMatcherProPitchLayerMode;
  tempoRatio: number;
  pitchRatio: number;
  requestedPlaybackRate: number;
  sourcePlaybackRate: number;
  pitchShiftSemitones: number;
  isPitchShifted: boolean;
  isTempoShifted: boolean;
  label: string;
  detail: string;
  warning: string;
};

export type TrackMatcherProPitchDspNodeLayerMode =
  | "passthrough"
  | "granular-active"
  | "future-granular";

export type TrackMatcherProPitchDspNodeLayerState = {
  mode: TrackMatcherProPitchDspNodeLayerMode;
  inputNode: GainNode | null;
  outputNode: GainNode | null;
  latencyMs: number;
  isInserted: boolean;
  label: string;
  detail: string;
  warning: string;
};

export type TrackMatcherProPitchGranularLayerState = {
  engine: TrackMatcherGranularPitchEngineRuntime | null;
  diagnostics: TrackMatcherGranularPitchEngineDiagnostics;
  isActive: boolean;
  label: string;
  detail: string;
  warning: string;
};

export type TrackMatcherProPitchPlaybackState = {
  sourceNode: AudioBufferSourceNode | null;
  gainNode: GainNode | null;
  dspNodeLayer: TrackMatcherProPitchDspNodeLayerState;
  granularLayer: TrackMatcherProPitchGranularLayerState;
  startedAtContextTime: number;
  pausedAtBufferTime: number;
  playbackRate: number;
  tempoRatio: number;
  pitchRatio: number;
  sourcePlaybackRate: number;
  pitchLayer: TrackMatcherProPitchLayerState;
  isPlaying: boolean;
};

export type TrackMatcherProPitchRuntimeState = {
  status: TrackMatcherProPitchRuntimeStatus;
  audioContext: AudioContext | null;
  audioBuffer: AudioBuffer | null;
  plan: TrackMatcherProPitchDspPlan | null;
  playback: TrackMatcherProPitchPlaybackState;
  error: string;
};

export type TrackMatcherDecodedAudioResult = {
  ok: boolean;
  audioBuffer: AudioBuffer | null;
  error: string;
};

export type TrackMatcherProPitchPlaybackResult = {
  ok: boolean;
  runtime: TrackMatcherProPitchRuntimeState;
  error: string;
};

export function createNeutralTrackMatcherProPitchLayerState(): TrackMatcherProPitchLayerState {
  return {
    mode: "none",
    tempoRatio: 1,
    pitchRatio: 1,
    requestedPlaybackRate: 1,
    sourcePlaybackRate: 1,
    pitchShiftSemitones: 0,
    isPitchShifted: false,
    isTempoShifted: false,
    label: "Pitch layer unavailable",
    detail: "No decoded Web Audio source is ready for Pro Pitch processing.",
    warning: "Browser Mode remains the fallback until the DSP runtime is ready.",
  };
}

export function createEmptyDspNodeLayerState(): TrackMatcherProPitchDspNodeLayerState {
  return {
    mode: "passthrough",
    inputNode: null,
    outputNode: null,
    latencyMs: 0,
    isInserted: false,
    label: "DSP node layer idle",
    detail: "No DSP insert slot is active yet.",
    warning: "",
  };
}

export function createEmptyGranularLayerState(): TrackMatcherProPitchGranularLayerState {
  return {
    engine: null,
    diagnostics: createStoppedTrackMatcherGranularPitchDiagnostics(),
    isActive: false,
    label: "Granular engine idle",
    detail: "No granular pitch engine is active yet.",
    warning: "",
  };
}

export function createEmptyPlaybackState(): TrackMatcherProPitchPlaybackState {
  return {
    sourceNode: null,
    gainNode: null,
    dspNodeLayer: createEmptyDspNodeLayerState(),
    granularLayer: createEmptyGranularLayerState(),
    startedAtContextTime: 0,
    pausedAtBufferTime: 0,
    playbackRate: 1,
    tempoRatio: 1,
    pitchRatio: 1,
    sourcePlaybackRate: 1,
    pitchLayer: createNeutralTrackMatcherProPitchLayerState(),
    isPlaying: false,
  };
}

export function createEmptyTrackMatcherProPitchRuntimeState(): TrackMatcherProPitchRuntimeState {
  return {
    status: "idle",
    audioContext: null,
    audioBuffer: null,
    plan: null,
    playback: createEmptyPlaybackState(),
    error: "",
  };
}
