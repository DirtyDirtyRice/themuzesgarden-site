export type MultiTrackDetectionStatus = "ready" | "waiting" | "future";

export type MultiTrackDetectionConfidence = "none" | "low" | "medium" | "high";

export type MultiTrackDetectionOwner =
  | "waveform"
  | "statistics"
  | "transient"
  | "cue"
  | "marker"
  | "timeline"
  | "analysis"
  | "dsp"
  | "future";

export type MultiTrackDetectionKind =
  | "tempo"
  | "key"
  | "transient"
  | "downbeat"
  | "section"
  | "loop"
  | "stem"
  | "sync"
  | "energy"
  | "silence";

export type MultiTrackDetectionItem = {
  detectionId: string;
  label: string;
  kind: MultiTrackDetectionKind;
  owner: MultiTrackDetectionOwner;
  status: MultiTrackDetectionStatus;
  confidence: MultiTrackDetectionConfidence;
  valueLabel: string;
  timeLabel: string;
  detail: string;
};

export type MultiTrackDetectionLane = {
  laneId: "track-a" | "track-b";
  title: string;
  sourceLabel: string;
  readinessLabel: string;

  tempoDetectionReady: boolean;
  keyDetectionReady: boolean;
  transientDetectionReady: boolean;
  downbeatDetectionReady: boolean;
  sectionDetectionReady: boolean;
  loopDetectionReady: boolean;
  stemDetectionReady: boolean;
  syncDetectionReady: boolean;

  detections: MultiTrackDetectionItem[];
};

export type MultiTrackDetectionWorkspace = {
  title: string;
  description: string;
  readinessLabel: string;
  lanes: MultiTrackDetectionLane[];
  safetyRules: string[];
  futureConnections: string[];
};