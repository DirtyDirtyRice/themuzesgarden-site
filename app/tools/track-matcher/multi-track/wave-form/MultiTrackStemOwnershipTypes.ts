export type MultiTrackStemOwnershipStatus = "ready" | "waiting" | "future";

export type MultiTrackStemKind =
  | "vocal"
  | "drums"
  | "bass"
  | "guitar"
  | "keys"
  | "melody"
  | "harmony"
  | "instrument"
  | "hybrid"
  | "reference";

export type MultiTrackStemOwner =
  | "waveform"
  | "detection"
  | "analysis"
  | "comparison"
  | "timeline"
  | "dsp"
  | "future";

export type MultiTrackStemOwnershipItem = {
  stemId: string;
  label: string;
  kind: MultiTrackStemKind;
  owner: MultiTrackStemOwner;
  status: MultiTrackStemOwnershipStatus;
  readinessLabel: string;
  routingLabel: string;
  detail: string;
};

export type MultiTrackStemOwnershipLane = {
  laneId: "track-a" | "track-b";
  title: string;
  sourceLabel: string;
  stemDetectionReady: boolean;
  stemRoutingReady: boolean;
  stemComparisonReady: boolean;
  stemDspReady: boolean;
  stems: MultiTrackStemOwnershipItem[];
};

export type MultiTrackStemOwnershipWorkspace = {
  title: string;
  description: string;
  readinessLabel: string;
  lanes: MultiTrackStemOwnershipLane[];
  ownershipRules: string[];
  futureConnections: string[];
};