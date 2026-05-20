export type TrackMatcherGranularPitchEngineStatus =
  | "idle"
  | "ready"
  | "playing"
  | "stopped"
  | "failed";

export type TrackMatcherGranularPitchEngineMode =
  | "inactive"
  | "granular-pitch";

export type TrackMatcherGranularPitchWindowShape =
  | "linear"
  | "equal-power"
  | "hann"
  | "cosine";

export type TrackMatcherGranularPitchQuality =
  | "draft"
  | "balanced"
  | "smooth"
  | "studio";

export type TrackMatcherGranularPitchTuning = {
  grainSizeMs: number;
  overlapRatio: number;
  smoothingMs: number;
  latencyMs: number;
  quality: TrackMatcherGranularPitchQuality;
  windowShape: TrackMatcherGranularPitchWindowShape;
  pitchShiftSemitones: number;
  detail: string;
  warning: string;
};

export type TrackMatcherGranularPitchEngineConfig = {
  tempoRatio: number;
  pitchRatio: number;
  grainSizeMs: number;
  overlapRatio: number;
  smoothingMs: number;
  latencyMs: number;
  startAtSeconds: number;
  durationSeconds: number;
  quality?: TrackMatcherGranularPitchQuality;
  windowShape?: TrackMatcherGranularPitchWindowShape;
};

export type TrackMatcherGranularPitchEngineDiagnostics = {
  status: TrackMatcherGranularPitchEngineStatus;
  mode: TrackMatcherGranularPitchEngineMode;
  tempoRatio: number;
  pitchRatio: number;
  sourcePlaybackRate: number;
  grainSizeMs: number;
  grainSpacingMs: number;
  overlapRatio: number;
  smoothingMs: number;
  latencyMs: number;
  scheduleAheadMs: number;
  scheduledGrainCount: number;
  activeGrainCount: number;
  startAtSeconds: number;
  currentBufferTime: number;
  startedAtContextTime: number;
  label: string;
  detail: string;
  warning: string;
};

export type TrackMatcherGranularPitchEngineRuntime = {
  status: TrackMatcherGranularPitchEngineStatus;
  mode: TrackMatcherGranularPitchEngineMode;
  outputNode: GainNode;
  stop: () => void;
  getCurrentBufferTime: () => number;
  getDiagnostics: () => TrackMatcherGranularPitchEngineDiagnostics;
};