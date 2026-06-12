export type MultiTrackDuplicationReadinessStatus =
  | "ready"
  | "needs-review"
  | "blocked"
  | "future";

export type MultiTrackDuplicationCloneStatus =
  | "draft"
  | "prepared"
  | "approved"
  | "duplicated"
  | "placed"
  | "archived";

export type MultiTrackDuplicationSourceKind =
  | "keeper-hook"
  | "extraction-region"
  | "arrangement-section"
  | "edit-lane"
  | "riff-pocket"
  | "bridge-mutation"
  | "seed";

export type MultiTrackDuplicationTargetKind =
  | "intro-copy"
  | "verse-copy"
  | "chorus-copy"
  | "hook-repeat"
  | "bridge-copy"
  | "outro-copy"
  | "edit-lane-copy"
  | "render-copy";

export type MultiTrackDuplicationAction =
  | "copy"
  | "repeat"
  | "offset"
  | "trim"
  | "loop"
  | "place"
  | "review"
  | "prepare-render";

export type MultiTrackDuplicationPriority =
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "parking-lot";

export type MultiTrackDuplicationRisk =
  | "timing-drift"
  | "weak-transition"
  | "overcrowded-arrangement"
  | "missing-source-audio"
  | "unreviewed-clone"
  | "render-risk"
  | "seed-placeholder";

export type MultiTrackDuplicationCheck = {
  id: string;
  label: string;
  passed: boolean;
  score: number;
  maxScore: number;
  detail: string;
};

export type MultiTrackDuplicationClone = {
  id: string;
  title: string;
  sourceId: string;
  sourceKind: MultiTrackDuplicationSourceKind;
  targetKind: MultiTrackDuplicationTargetKind;
  readinessStatus: MultiTrackDuplicationReadinessStatus;
  cloneStatus: MultiTrackDuplicationCloneStatus;
  priority: MultiTrackDuplicationPriority;
  sourceStartBar: number;
  sourceEndBar: number;
  targetStartBar: number;
  targetEndBar: number;
  repeatCount: number;
  offsetBeats: number;
  bpm: number;
  keyLabel: string;
  cloneScore: number;
  timingScore: number;
  transitionScore: number;
  renderScore: number;
  actions: MultiTrackDuplicationAction[];
  checks: MultiTrackDuplicationCheck[];
  risks: MultiTrackDuplicationRisk[];
  detail: string;
  notes: string[];
};

export type MultiTrackDuplicationLane = {
  id: string;
  title: string;
  targetKind: MultiTrackDuplicationTargetKind;
  readinessStatus: MultiTrackDuplicationReadinessStatus;
  cloneIds: string[];
  description: string;
};

export type MultiTrackDuplicationPlanStep = {
  id: string;
  cloneId: string;
  order: number;
  label: string;
  action: MultiTrackDuplicationAction;
  readinessStatus: MultiTrackDuplicationReadinessStatus;
  detail: string;
};

export type MultiTrackDuplicationWorkspaceState = {
  id: string;
  title: string;
  description: string;
  readinessStatus: MultiTrackDuplicationReadinessStatus;
  clones: MultiTrackDuplicationClone[];
  lanes: MultiTrackDuplicationLane[];
  planSteps: MultiTrackDuplicationPlanStep[];
  notes: string[];
};