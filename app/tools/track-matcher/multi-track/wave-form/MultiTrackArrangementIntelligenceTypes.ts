export type MultiTrackArrangementReadinessStatus =
  | "ready"
  | "needs-review"
  | "blocked"
  | "future";

export type MultiTrackArrangementSectionType =
  | "intro"
  | "verse"
  | "pre-chorus"
  | "chorus"
  | "post-chorus"
  | "bridge"
  | "breakdown"
  | "solo"
  | "hook"
  | "turnaround"
  | "outro"
  | "unknown"
  | "future";

export type MultiTrackArrangementEnergyLevel =
  | "low"
  | "medium"
  | "high"
  | "peak"
  | "unknown";

export type MultiTrackArrangementRole =
  | "setup"
  | "story"
  | "lift"
  | "release"
  | "contrast"
  | "reset"
  | "transition"
  | "ending"
  | "unknown";

export type MultiTrackArrangementEvidenceSource =
  | "manual-marker"
  | "cue"
  | "waveform"
  | "transient"
  | "detection"
  | "comparison"
  | "confidence"
  | "future-ai";

export type MultiTrackArrangementRisk =
  | "missing-section-boundary"
  | "missing-duration"
  | "unclear-role"
  | "weak-confidence"
  | "needs-human-review"
  | "future-only";

export type MultiTrackArrangementSection = {
  id: string;
  label: string;
  sectionType: MultiTrackArrangementSectionType;
  startLabel: string;
  endLabel: string;
  durationLabel: string;
  energyLevel: MultiTrackArrangementEnergyLevel;
  role: MultiTrackArrangementRole;
  evidenceSource: MultiTrackArrangementEvidenceSource;
  readinessStatus: MultiTrackArrangementReadinessStatus;
  confidenceLabel: string;
  notes: string;
  risks: MultiTrackArrangementRisk[];
};

export type MultiTrackArrangementFlow = {
  id: string;
  title: string;
  description: string;
  sectionIds: string[];
  readinessStatus: MultiTrackArrangementReadinessStatus;
  reviewNote: string;
};

export type MultiTrackArrangementPattern = {
  id: string;
  title: string;
  description: string;
  sectionTypes: MultiTrackArrangementSectionType[];
  readinessStatus: MultiTrackArrangementReadinessStatus;
  useCase: string;
};

export type MultiTrackArrangementChecklistItem = {
  id: string;
  label: string;
  status: MultiTrackArrangementReadinessStatus;
  detail: string;
};

export type MultiTrackArrangementWorkspaceState = {
  title: string;
  description: string;
  status: MultiTrackArrangementReadinessStatus;
  sections: MultiTrackArrangementSection[];
  flows: MultiTrackArrangementFlow[];
  patterns: MultiTrackArrangementPattern[];
  checklist: MultiTrackArrangementChecklistItem[];
};