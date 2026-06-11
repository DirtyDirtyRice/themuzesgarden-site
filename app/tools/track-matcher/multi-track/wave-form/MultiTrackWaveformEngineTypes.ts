export type MultiTrackWaveformEngineReadiness =
  | "ready"
  | "needs-audio"
  | "needs-review"
  | "blocked"
  | "future";

export type MultiTrackWaveformEngineSourceKind =
  | "track-a"
  | "track-b"
  | "stem"
  | "reference"
  | "suno-version"
  | "hybrid-render"
  | "manual-import";

export type MultiTrackWaveformEngineChannelMode =
  | "mono"
  | "stereo"
  | "dual-mono"
  | "multi-channel"
  | "unknown";

export type MultiTrackWaveformEngineFrameStatus =
  | "measured"
  | "estimated"
  | "placeholder"
  | "missing"
  | "future";

export type MultiTrackWaveformEngineCheckpointStatus =
  | "ready"
  | "needs-audio"
  | "needs-decode"
  | "needs-analysis"
  | "needs-review"
  | "blocked"
  | "future";

export type MultiTrackWaveformEngineMetricDirection =
  | "higher-is-better"
  | "lower-is-better"
  | "range-is-better"
  | "informational";

export type MultiTrackWaveformEngineDecodeStepKind =
  | "load-file"
  | "read-buffer"
  | "decode-audio"
  | "normalize-channels"
  | "frame-analysis"
  | "peak-map"
  | "rms-map"
  | "summary";

export type MultiTrackWaveformEngineFrame = {
  frameId: string;
  startMs: number;
  endMs: number;
  peak: number;
  rms: number;
  zeroCrossingRate: number;
  status: MultiTrackWaveformEngineFrameStatus;
};

export type MultiTrackWaveformEngineChannelSummary = {
  channelId: string;
  label: string;
  peak: number;
  rms: number;
  averageRms: number;
  minPeak: number;
  maxPeak: number;
  frameCount: number;
  status: MultiTrackWaveformEngineFrameStatus;
};

export type MultiTrackWaveformEngineDecodeStep = {
  stepId: string;
  kind: MultiTrackWaveformEngineDecodeStepKind;
  label: string;
  detail: string;
  status: MultiTrackWaveformEngineCheckpointStatus;
  owner: string;
};

export type MultiTrackWaveformEngineMetric = {
  metricId: string;
  label: string;
  valueLabel: string;
  detail: string;
  direction: MultiTrackWaveformEngineMetricDirection;
  status: MultiTrackWaveformEngineCheckpointStatus;
};

export type MultiTrackWaveformEngineSource = {
  sourceId: string;
  title: string;
  sourceKind: MultiTrackWaveformEngineSourceKind;
  fileLabel: string;
  durationMs: number;
  sampleRate: number;
  bitDepth: number;
  channelMode: MultiTrackWaveformEngineChannelMode;
  channelCount: number;
  frameSizeMs: number;
  waveformReady: boolean;
  statisticsReady: boolean;
  transientReady: boolean;
  decodeSteps: MultiTrackWaveformEngineDecodeStep[];
  metrics: MultiTrackWaveformEngineMetric[];
  channelSummaries: MultiTrackWaveformEngineChannelSummary[];
  frames: MultiTrackWaveformEngineFrame[];
  notes: string[];
  readiness: MultiTrackWaveformEngineReadiness;
};

export type MultiTrackWaveformEngineWorkspace = {
  workspaceId: string;
  title: string;
  summary: string;
  readiness: MultiTrackWaveformEngineReadiness;
  readinessLabel: string;
  engineGoal: string;
  engineBoundary: string;
  sources: MultiTrackWaveformEngineSource[];
  engineRules: string[];
  nextEngineSteps: string[];
};