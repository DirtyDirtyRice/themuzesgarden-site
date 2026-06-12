export type MultiTrackArrangementReadinessStatus =
  | "ready"
  | "needs-review"
  | "blocked"
  | "future";

export type MultiTrackArrangementSectionKind =
  | "intro"
  | "verse"
  | "pre-chorus"
  | "chorus"
  | "hook"
  | "bridge"
  | "breakdown"
  | "solo"
  | "outro"
  | "transition";

export type MultiTrackArrangementSourceKind =
  | "keeper-extraction"
  | "keeper-promotion"
  | "keeper-comparison"
  | "original-idea"
  | "suno-version"
  | "manual-section"
  | "seed";

export type MultiTrackArrangementAction =
  | "place"
  | "duplicate"
  | "trim"
  | "loop"
  | "move"
  | "swap"
  | "review"
  | "prepare-render";

export type MultiTrackArrangementPriority =
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "parking-lot";

export type MultiTrackArrangementRisk =
  | "missing-audio"
  | "rough-transition"
  | "weak-hook"
  | "needs-human-review"
  | "timing-risk"
  | "key-risk"
  | "energy-drop"
  | "seed-placeholder";

export type MultiTrackArrangementSection = {
  id: string;
  title: string;
  sourceId: string;
  sourceKind: MultiTrackArrangementSourceKind;
  sectionKind: MultiTrackArrangementSectionKind;
  readinessStatus: MultiTrackArrangementReadinessStatus;
  priority: MultiTrackArrangementPriority;
  startBar: number;
  endBar: number;
  targetOrder: number;
  repeatCount: number;
  bpm: number;
  keyLabel: string;
  energyScore: number;
  hookScore: number;
  transitionScore: number;
  arrangementScore: number;
  actions: MultiTrackArrangementAction[];
  risks: MultiTrackArrangementRisk[];
  detail: string;
  notes: string[];
};

export type MultiTrackArrangementLane = {
  id: string;
  title: string;
  sectionKind: MultiTrackArrangementSectionKind;
  readinessStatus: MultiTrackArrangementReadinessStatus;
  sectionIds: string[];
  description: string;
};

export type MultiTrackArrangementBlueprintStep = {
  id: string;
  sectionId: string;
  order: number;
  label: string;
  action: MultiTrackArrangementAction;
  readinessStatus: MultiTrackArrangementReadinessStatus;
  detail: string;
};

export type MultiTrackArrangementRenderPrepItem = {
  id: string;
  sectionId: string;
  label: string;
  readinessStatus: MultiTrackArrangementReadinessStatus;
  renderPriority: MultiTrackArrangementPriority;
  detail: string;
};

export type MultiTrackArrangementWorkspaceState = {
  id: string;
  title: string;
  description: string;
  readinessStatus: MultiTrackArrangementReadinessStatus;
  sections: MultiTrackArrangementSection[];
  lanes: MultiTrackArrangementLane[];
  blueprintSteps: MultiTrackArrangementBlueprintStep[];
  renderPrepItems: MultiTrackArrangementRenderPrepItem[];
  notes: string[];
};