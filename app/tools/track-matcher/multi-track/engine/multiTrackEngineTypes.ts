export type MultiTrackEngineTrackSlotId = "track-a" | "track-b";

export type MultiTrackEngineReadinessLevel =
  | "empty"
  | "draft"
  | "ready"
  | "warning"
  | "blocked";

export type MultiTrackEngineSyncStatus =
  | "not-started"
  | "waiting"
  | "aligned"
  | "drifting"
  | "blocked";

export type MultiTrackEngineDecisionRoute =
  | "hold"
  | "inspect-track-a"
  | "inspect-track-b"
  | "compare"
  | "sync"
  | "analyze"
  | "save"
  | "export";

export type MultiTrackEngineMarkerKind =
  | "intro"
  | "verse"
  | "pre-chorus"
  | "chorus"
  | "bridge"
  | "drop"
  | "break"
  | "solo"
  | "outro"
  | "custom";

export type MultiTrackEngineFindingSeverity = "info" | "good" | "warning" | "blocked";

export type MultiTrackEngineSignalPolarity = "positive" | "neutral" | "negative";

export type MultiTrackEngineSourceKind =
  | "empty"
  | "library"
  | "project"
  | "upload"
  | "finder"
  | "seed";

export type MultiTrackEngineTransportStatus =
  | "stopped"
  | "playing"
  | "paused"
  | "scrubbing"
  | "looping";

export type MultiTrackEngineCueKind =
  | "entry"
  | "exit"
  | "downbeat"
  | "transition"
  | "impact"
  | "vocal"
  | "instrument"
  | "custom";

export type MultiTrackEngineLaneId =
  | "overview"
  | "waveform"
  | "tempo"
  | "key"
  | "structure"
  | "sync"
  | "decision";

export type MultiTrackEngineTrackState = {
  trackSlotId: MultiTrackEngineTrackSlotId;
  label: string;
  shortLabel: string;
  sourceLabel: string;
  sourceKind: MultiTrackEngineSourceKind;
  sourceId: string;
  title: string;
  artist: string;
  album: string;
  durationSeconds: number;
  bpm: number | null;
  keyLabel: string;
  sampleRate: number | null;
  channelCount: number | null;
  gainDb: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  armed: boolean;
  locked: boolean;
  loaded: boolean;
  waveformReady: boolean;
  analysisReady: boolean;
  syncReady: boolean;
  transientReady: boolean;
  metadataReady: boolean;
  readiness: MultiTrackEngineReadinessLevel;
  colorToken: string;
  notes: string[];
};

export type MultiTrackEngineComparisonSignal = {
  id: string;
  label: string;
  detail: string;
  polarity: MultiTrackEngineSignalPolarity;
  score: number;
  weight: number;
  ready: boolean;
};

export type MultiTrackEngineComparisonState = {
  status: MultiTrackEngineSyncStatus;
  readiness: MultiTrackEngineReadinessLevel;
  averageScore: number;
  weightedScore: number;
  strongestMatchLabel: string;
  weakestMatchLabel: string;
  summary: string;
  signals: MultiTrackEngineComparisonSignal[];
};

export type MultiTrackEngineTimelineMarker = {
  id: string;
  trackSlotId: MultiTrackEngineTrackSlotId | "both";
  kind: MultiTrackEngineMarkerKind;
  label: string;
  startSeconds: number;
  endSeconds: number;
  confidence: number;
  locked: boolean;
};

export type MultiTrackEngineTimelineCue = {
  id: string;
  trackSlotId: MultiTrackEngineTrackSlotId | "both";
  kind: MultiTrackEngineCueKind;
  label: string;
  seconds: number;
  confidence: number;
  note: string;
};

export type MultiTrackEngineTimelineState = {
  status: MultiTrackEngineSyncStatus;
  transportStatus: MultiTrackEngineTransportStatus;
  zoomLevel: number;
  playheadSeconds: number;
  loopEnabled: boolean;
  loopStartSeconds: number;
  loopEndSeconds: number;
  snapToMarkers: boolean;
  markers: MultiTrackEngineTimelineMarker[];
  cues: MultiTrackEngineTimelineCue[];
};

export type MultiTrackEngineAnalysisFinding = {
  id: string;
  trackSlotId: MultiTrackEngineTrackSlotId | "both";
  label: string;
  detail: string;
  severity: MultiTrackEngineFindingSeverity;
  actionLabel: string;
};

export type MultiTrackEngineLaneReadiness = {
  laneId: MultiTrackEngineLaneId;
  label: string;
  readiness: MultiTrackEngineReadinessLevel;
  score: number;
  detail: string;
};

export type MultiTrackEngineAnalysisState = {
  readiness: MultiTrackEngineReadinessLevel;
  summary: string;
  nextStepLabel: string;
  findingCount: number;
  warningCount: number;
  blockedCount: number;
  laneReadiness: MultiTrackEngineLaneReadiness[];
  findings: MultiTrackEngineAnalysisFinding[];
};

export type MultiTrackEngineDecisionState = {
  route: MultiTrackEngineDecisionRoute;
  readiness: MultiTrackEngineReadinessLevel;
  primaryActionLabel: string;
  secondaryActionLabel: string;
  reason: string;
  canSave: boolean;
  canExport: boolean;
};

export type MultiTrackEngineSnapshot = {
  snapshotId: string;
  createdAtLabel: string;
  summary: string;
  trackA: MultiTrackEngineTrackState;
  trackB: MultiTrackEngineTrackState;
  comparison: MultiTrackEngineComparisonState;
  timeline: MultiTrackEngineTimelineState;
  analysis: MultiTrackEngineAnalysisState;
  decision: MultiTrackEngineDecisionState;
};

export type MultiTrackEngineState = {
  engineId: string;
  versionLabel: string;
  editedAtLabel: string;
  trackA: MultiTrackEngineTrackState;
  trackB: MultiTrackEngineTrackState;
  comparison: MultiTrackEngineComparisonState;
  timeline: MultiTrackEngineTimelineState;
  analysis: MultiTrackEngineAnalysisState;
  decision: MultiTrackEngineDecisionState;
  snapshots: MultiTrackEngineSnapshot[];
};