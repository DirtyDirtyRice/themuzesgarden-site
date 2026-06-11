export type MultiTrackWaveformStatisticsEngineReadiness =
  | "ready"
  | "needs-waveform"
  | "needs-audio"
  | "needs-review"
  | "blocked"
  | "future";

export type MultiTrackWaveformStatisticsEngineStatus =
  | "measured"
  | "estimated"
  | "seeded"
  | "missing"
  | "future";

export type MultiTrackWaveformStatisticsEngineSourceKind =
  | "track-a"
  | "track-b"
  | "suno-version"
  | "stem"
  | "reference"
  | "hybrid-render";

export type MultiTrackWaveformStatisticsEngineRiskLevel =
  | "low"
  | "medium"
  | "high"
  | "blocked";

export type MultiTrackWaveformStatisticsEngineMeasurementKind =
  | "peak"
  | "rms"
  | "crest-factor"
  | "dynamic-range"
  | "silence"
  | "energy"
  | "stereo-width"
  | "clip-risk"
  | "noise-floor";

export type MultiTrackWaveformStatisticsEngineWindow = {
  windowId: string;
  label: string;
  startMs: number;
  endMs: number;
  peak: number;
  rms: number;
  energy: number;
  dynamicRange: number;
  silencePercent: number;
  clipRisk: MultiTrackWaveformStatisticsEngineRiskLevel;
  status: MultiTrackWaveformStatisticsEngineStatus;
};

export type MultiTrackWaveformStatisticsEngineMeasurement = {
  measurementId: string;
  kind: MultiTrackWaveformStatisticsEngineMeasurementKind;
  label: string;
  value: number;
  valueLabel: string;
  detail: string;
  status: MultiTrackWaveformStatisticsEngineStatus;
  risk: MultiTrackWaveformStatisticsEngineRiskLevel;
};

export type MultiTrackWaveformStatisticsEngineFinding = {
  findingId: string;
  title: string;
  detail: string;
  action: string;
  status: MultiTrackWaveformStatisticsEngineStatus;
  risk: MultiTrackWaveformStatisticsEngineRiskLevel;
};

export type MultiTrackWaveformStatisticsEngineSource = {
  sourceId: string;
  title: string;
  sourceKind: MultiTrackWaveformStatisticsEngineSourceKind;
  fileLabel: string;
  durationMs: number;
  sampleRate: number;
  bitDepth: number;
  channelCount: number;
  readiness: MultiTrackWaveformStatisticsEngineReadiness;
  waveformReady: boolean;
  statisticsReady: boolean;
  transientReady: boolean;
  measurements: MultiTrackWaveformStatisticsEngineMeasurement[];
  windows: MultiTrackWaveformStatisticsEngineWindow[];
  findings: MultiTrackWaveformStatisticsEngineFinding[];
  notes: string[];
};

export type MultiTrackWaveformStatisticsEngineComparison = {
  comparisonId: string;
  title: string;
  leftSourceId: string;
  rightSourceId: string;
  peakDifference: number;
  rmsDifference: number;
  energyDifference: number;
  detail: string;
  status: MultiTrackWaveformStatisticsEngineStatus;
  risk: MultiTrackWaveformStatisticsEngineRiskLevel;
};

export type MultiTrackWaveformStatisticsEngineWorkspace = {
  workspaceId: string;
  title: string;
  summary: string;
  readiness: MultiTrackWaveformStatisticsEngineReadiness;
  readinessLabel: string;
  engineGoal: string;
  sources: MultiTrackWaveformStatisticsEngineSource[];
  comparisons: MultiTrackWaveformStatisticsEngineComparison[];
  engineRules: string[];
  nextSteps: string[];
};