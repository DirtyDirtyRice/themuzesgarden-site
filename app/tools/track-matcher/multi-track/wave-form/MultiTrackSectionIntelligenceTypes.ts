export type MultiTrackSectionReadinessStatus =
  | "ready"
  | "needs-review"
  | "blocked"
  | "future";

export type MultiTrackSectionRole =
  | "intro"
  | "setup"
  | "story"
  | "lift"
  | "hook"
  | "release"
  | "contrast"
  | "reset"
  | "solo"
  | "transition"
  | "ending"
  | "unknown"
  | "future";

export type MultiTrackSectionBehavior =
  | "stable"
  | "builds"
  | "drops"
  | "changes-key"
  | "changes-groove"
  | "adds-stems"
  | "removes-stems"
  | "repeats"
  | "varies"
  | "unknown"
  | "future";

export type MultiTrackSectionEvidenceSource =
  | "manual-section"
  | "cue"
  | "marker"
  | "waveform"
  | "transient"
  | "detection"
  | "arrangement"
  | "comparison"
  | "confidence"
  | "future-ai";

export type MultiTrackSectionEnergyShape =
  | "flat"
  | "rising"
  | "falling"
  | "dip-and-return"
  | "peak"
  | "unknown"
  | "future";

export type MultiTrackSectionTransitionType =
  | "clean-cut"
  | "fade"
  | "fill"
  | "drop"
  | "pickup"
  | "overlap"
  | "stop"
  | "unknown"
  | "future";

export type MultiTrackSectionRisk =
  | "missing-boundary"
  | "missing-cue"
  | "missing-marker"
  | "weak-confidence"
  | "unclear-transition"
  | "unverified-section-role"
  | "needs-human-review"
  | "future-only";

export type MultiTrackSectionUnit = {
  id: string;
  label: string;
  role: MultiTrackSectionRole;
  behavior: MultiTrackSectionBehavior;
  energyShape: MultiTrackSectionEnergyShape;
  transitionIn: MultiTrackSectionTransitionType;
  transitionOut: MultiTrackSectionTransitionType;
  startLabel: string;
  endLabel: string;
  durationLabel: string;
  evidenceSource: MultiTrackSectionEvidenceSource;
  readinessStatus: MultiTrackSectionReadinessStatus;
  confidenceLabel: string;
  summary: string;
  reviewNote: string;
  risks: MultiTrackSectionRisk[];
};

export type MultiTrackSectionTransition = {
  id: string;
  fromSectionId: string;
  toSectionId: string;
  transitionType: MultiTrackSectionTransitionType;
  readinessStatus: MultiTrackSectionReadinessStatus;
  evidenceSource: MultiTrackSectionEvidenceSource;
  confidenceLabel: string;
  description: string;
  risks: MultiTrackSectionRisk[];
};

export type MultiTrackSectionReviewGroup = {
  id: string;
  title: string;
  description: string;
  status: MultiTrackSectionReadinessStatus;
  sectionIds: string[];
  transitionIds: string[];
  reviewGoal: string;
};

export type MultiTrackSectionChecklistItem = {
  id: string;
  label: string;
  status: MultiTrackSectionReadinessStatus;
  detail: string;
};

export type MultiTrackSectionWorkspaceState = {
  title: string;
  description: string;
  status: MultiTrackSectionReadinessStatus;
  sections: MultiTrackSectionUnit[];
  transitions: MultiTrackSectionTransition[];
  reviewGroups: MultiTrackSectionReviewGroup[];
  checklist: MultiTrackSectionChecklistItem[];
};