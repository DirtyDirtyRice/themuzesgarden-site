export type MultiTrackPromptExportReadinessStatus =
  | "ready"
  | "needs-review"
  | "blocked"
  | "future";

export type MultiTrackPromptExportConfidenceLevel =
  | "high"
  | "medium"
  | "low"
  | "manual-required";

export type MultiTrackPromptExportOwner =
  | "user"
  | "manual-review"
  | "future-ai"
  | "future-analyzer"
  | "future-exporter"
  | "future-hybrid-builder";

export type MultiTrackPromptExportSource =
  | "track-a"
  | "track-b"
  | "comparison"
  | "confidence"
  | "ai-prompt"
  | "hybrid-plan"
  | "manual-note"
  | "future-analysis";

export type MultiTrackPromptExportTarget =
  | "suno"
  | "project-note"
  | "library-note"
  | "hybrid-builder"
  | "training-log"
  | "manual-copy"
  | "future-export-api";

export type MultiTrackPromptExportFormat =
  | "plain-text"
  | "structured-note"
  | "question-list"
  | "safety-summary"
  | "builder-instruction"
  | "training-feedback";

export type MultiTrackPromptExportRisk =
  | "missing-user-approval"
  | "missing-confidence"
  | "invented-bpm"
  | "invented-key"
  | "false-lineage"
  | "false-stem-label"
  | "unsafe-builder-command"
  | "unreviewed-ai-output";

export type MultiTrackPromptExportGate = {
  id: string;
  label: string;
  source: MultiTrackPromptExportSource;
  status: MultiTrackPromptExportReadinessStatus;
  confidence: MultiTrackPromptExportConfidenceLevel;
  owner: MultiTrackPromptExportOwner;
  requirement: string;
  missingBehavior: string;
};

export type MultiTrackPromptExportPlan = {
  id: string;
  label: string;
  target: MultiTrackPromptExportTarget;
  format: MultiTrackPromptExportFormat;
  status: MultiTrackPromptExportReadinessStatus;
  confidence: MultiTrackPromptExportConfidenceLevel;
  owner: MultiTrackPromptExportOwner;
  purpose: string;
  allowedSources: MultiTrackPromptExportSource[];
  exportRule: string;
  blockedUntil: string;
};

export type MultiTrackPromptExportRiskItem = {
  id: string;
  risk: MultiTrackPromptExportRisk;
  label: string;
  status: MultiTrackPromptExportReadinessStatus;
  owner: MultiTrackPromptExportOwner;
  detail: string;
  preventionRule: string;
};

export type MultiTrackPromptExportChecklistItem = {
  id: string;
  label: string;
  status: MultiTrackPromptExportReadinessStatus;
  owner: MultiTrackPromptExportOwner;
  detail: string;
};

export type MultiTrackPromptExportPreviewCard = {
  id: string;
  label: string;
  target: MultiTrackPromptExportTarget;
  format: MultiTrackPromptExportFormat;
  status: MultiTrackPromptExportReadinessStatus;
  summary: string;
  safeOutputExample: string;
};

export type MultiTrackPromptExportWorkspaceState = {
  title: string;
  description: string;
  gates: MultiTrackPromptExportGate[];
  plans: MultiTrackPromptExportPlan[];
  risks: MultiTrackPromptExportRiskItem[];
  checklist: MultiTrackPromptExportChecklistItem[];
  previewCards: MultiTrackPromptExportPreviewCard[];
};