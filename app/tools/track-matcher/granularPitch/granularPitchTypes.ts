export type TrackMatcherGranularPitchEngineConfig = {
  tempoRatio: number;
  pitchRatio: number;
  grainSizeMs: number;
  overlapRatio: number;
  scheduleAheadMs: number;
  crossfadeMs: number;
  maxActiveGrains: number;
};

export type TrackMatcherGranularPitchEngineDiagnostics = {
  status: string;
  mode: string;
  tempoRatio: number;
  pitchRatio: number;
  sourcePlaybackRate: number;
  pitchShiftSemitones: number;
  grainSizeMs: number;
  grainSpacingMs: number;
  scheduleAheadMs: number;
  scheduledGrainCount: number;
  activeGrainCount: number;
  currentBufferTime: number;
  startedAtContextTime: number;
  error: string;
  label: string;
  detail: string;
  warning: string;
};

export type GranularGrain = {
  id: number;
  source: AudioBufferSourceNode;
  gain: GainNode;
  startTime: number;
  offset: number;
  duration: number;
};