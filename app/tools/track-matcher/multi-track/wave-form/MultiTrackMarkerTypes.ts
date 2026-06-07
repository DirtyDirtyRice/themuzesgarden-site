export type MultiTrackMarkerStatus = "ready" | "waiting" | "future";

export type MultiTrackMarkerKind =
  | "intro"
  | "verse"
  | "chorus"
  | "bridge"
  | "outro"
  | "loop"
  | "drop"
  | "breakdown"
  | "custom";

export type MultiTrackMarkerConfidence = "none" | "low" | "medium" | "high";

export type MultiTrackMarkerOwnership =
  | "waveform"
  | "timeline"
  | "cue"
  | "transient"
  | "analysis"
  | "future";

export type MultiTrackMarkerPoint = {
  markerId: string;
  label: string;
  kind: MultiTrackMarkerKind;
  status: MultiTrackMarkerStatus;
  confidence: MultiTrackMarkerConfidence;
  timeLabel: string;
  timeSeconds: number;
  owner: MultiTrackMarkerOwnership;
  detail: string;
};

export type MultiTrackMarkerLane = {
  laneId: "track-a" | "track-b";
  title: string;
  sourceLabel: string;
  markerCountLabel: string;
  activeMarkerLabel: string;
  markerGenerationReady: boolean;
  timelineOwnershipReady: boolean;
  cueOwnershipReady: boolean;
  transientOwnershipReady: boolean;
  markers: MultiTrackMarkerPoint[];
};

export type MultiTrackMarkerWorkspace = {
  title: string;
  description: string;
  readinessLabel: string;
  lanes: MultiTrackMarkerLane[];
  markerRules: string[];
  futureConnections: string[];
};