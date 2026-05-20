export type TrackMode = "major" | "minor";

export type TrackMatcherDeckId = "A" | "B";

export type TrackMatcherLaneRole =
  | "original-idea"
  | "suno-result"
  | "reference-song"
  | "vocal"
  | "melody"
  | "harmony"
  | "drums"
  | "bass"
  | "instrument"
  | "stem"
  | "hybrid"
  | "analysis";

export type TrackMatcherLaneSourceKind =
  | "user-recording"
  | "suno-render"
  | "uploaded-song"
  | "separated-stem"
  | "generated-hybrid"
  | "analysis-output";

export type TrackMatcherLaneRelationshipKind =
  | "original-to-suno"
  | "stem-from-song"
  | "riff-match"
  | "melody-to-chord"
  | "tempo-match"
  | "key-match"
  | "hybrid-source";

export type TrackMatcherLaneId = string;

export type TrackMatcherLaneMetadata = {
  laneId: TrackMatcherLaneId;
  deckId?: TrackMatcherDeckId;
  title: string;
  role: TrackMatcherLaneRole;
  sourceKind: TrackMatcherLaneSourceKind;
  sourceTrackName: string;
  parentLaneId?: TrackMatcherLaneId;
  relationshipKind?: TrackMatcherLaneRelationshipKind;
  isPrimaryComparisonLane: boolean;
  isStemLane: boolean;
  isHybridCandidate: boolean;
};

export type TrackMatcherLaneRelationship = {
  fromLaneId: TrackMatcherLaneId;
  toLaneId: TrackMatcherLaneId;
  kind: TrackMatcherLaneRelationshipKind;
  label: string;
  confidence: number;
};

export type TrackMatcherTrackState = {
  bpm: number;
  keyIndex: number;
  mode: TrackMode;
  trackName: string;
  fileUrl: string | null;
};

export type SyncStatus = "idle" | "locked" | "adjusting" | "drifting";

export type SyncSnapshot = {
  status: SyncStatus;
  driftSeconds: number;
  phaseSeconds: number;
  bpmDifference: number;
  rateCorrection: number;
};

export type ControllerReadinessStatus =
  | "empty"
  | "loading"
  | "browser-only"
  | "pro-pitch-ready"
  | "failed";

export type ControllerDeckSnapshot = {
  deckId: TrackMatcherDeckId;
  title: string;
  trackName: string;
  fileLoaded: boolean;
  bpm: number;
  keyLabel: string;
  keyShiftSemitones: number;
  mode: TrackMode;
  runtimeStatus:
    | "idle"
    | "unsupported"
    | "loading"
    | "ready"
    | "playing"
    | "paused"
    | "stopped"
    | "failed";
  readinessStatus: ControllerReadinessStatus;
  canUseProPitch: boolean;
  browserRate: number;
  effectiveRate: number;
  warning: string;
  detail: string;
};

export type ControllerEngineHealth = {
  status: ControllerReadinessStatus;
  label: string;
  detail: string;
  toneClasses: string;
};