export type MultiTrackDspOwnershipStatus = "ready" | "waiting" | "future";

export type MultiTrackDspProcessKind =
  | "gain"
  | "pitch"
  | "tempo"
  | "stretch"
  | "sync"
  | "filter"
  | "eq"
  | "compressor"
  | "limiter"
  | "stem"
  | "render";

export type MultiTrackDspOwner =
  | "browser"
  | "web-audio"
  | "granular"
  | "waveform"
  | "stem"
  | "analysis"
  | "future";

export type MultiTrackDspOwnershipItem = {
  processId: string;
  label: string;
  kind: MultiTrackDspProcessKind;
  owner: MultiTrackDspOwner;
  status: MultiTrackDspOwnershipStatus;
  readinessLabel: string;
  routeLabel: string;
  detail: string;
};

export type MultiTrackDspOwnershipLane = {
  laneId: "track-a" | "track-b";
  title: string;
  sourceLabel: string;

  browserPlaybackReady: boolean;
  proPitchReady: boolean;
  granularReady: boolean;
  stemDspReady: boolean;
  renderReady: boolean;

  processes: MultiTrackDspOwnershipItem[];
};

export type MultiTrackDspOwnershipWorkspace = {
  title: string;
  description: string;
  readinessLabel: string;
  lanes: MultiTrackDspOwnershipLane[];
  ownershipRules: string[];
  futureConnections: string[];
};