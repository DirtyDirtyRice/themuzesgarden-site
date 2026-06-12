export type MultiTrackKeeperExtractionReadinessStatus =
  | "ready"
  | "needs-review"
  | "blocked"
  | "future";

export type MultiTrackKeeperExtractionRegionKind =
  | "hook"
  | "riff"
  | "chorus"
  | "verse"
  | "bridge"
  | "breakdown"
  | "intro"
  | "outro"
  | "transition";

export type MultiTrackKeeperExtractionConfidence =
  | "verified"
  | "strong"
  | "medium"
  | "weak"
  | "missing";

export type MultiTrackKeeperExtractionAction =
  | "extract"
  | "duplicate"
  | "trim"
  | "loop"
  | "send-to-edit-lane"
  | "send-to-arrangement"
  | "send-to-render-queue"
  | "review";

export type MultiTrackKeeperExtractionRisk =
  | "rough-boundary"
  | "missing-downbeat"
  | "missing-bpm"
  | "missing-key"
  | "overlap-risk"
  | "needs-human-confirmation"
  | "seed-placeholder";

export type MultiTrackKeeperExtractionRegion = {
  id: string;
  title: string;
  sourceVersionLabel: string;
  sourceCandidateId: string;
  regionKind: MultiTrackKeeperExtractionRegionKind;
  readinessStatus: MultiTrackKeeperExtractionReadinessStatus;
  confidence: MultiTrackKeeperExtractionConfidence;
  startBeat: number;
  endBeat: number;
  startTimeSeconds: number;
  endTimeSeconds: number;
  bpm: number;
  keyLabel: string;
  strengthScore: number;
  boundaryScore: number;
  loopScore: number;
  extractionScore: number;
  actions: MultiTrackKeeperExtractionAction[];
  risks: MultiTrackKeeperExtractionRisk[];
  detail: string;
  notes: string[];
};

export type MultiTrackKeeperExtractionLane = {
  id: string;
  title: string;
  regionKind: MultiTrackKeeperExtractionRegionKind;
  readinessStatus: MultiTrackKeeperExtractionReadinessStatus;
  regionIds: string[];
  description: string;
};

export type MultiTrackKeeperExtractionPlanStep = {
  id: string;
  regionId: string;
  order: number;
  action: MultiTrackKeeperExtractionAction;
  label: string;
  readinessStatus: MultiTrackKeeperExtractionReadinessStatus;
  detail: string;
};

export type MultiTrackKeeperExtractionWorkspaceState = {
  id: string;
  title: string;
  description: string;
  readinessStatus: MultiTrackKeeperExtractionReadinessStatus;
  regions: MultiTrackKeeperExtractionRegion[];
  lanes: MultiTrackKeeperExtractionLane[];
  planSteps: MultiTrackKeeperExtractionPlanStep[];
  notes: string[];
};