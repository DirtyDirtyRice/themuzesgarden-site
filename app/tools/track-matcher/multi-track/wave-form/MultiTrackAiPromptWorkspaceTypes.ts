export type MultiTrackAiPromptReadinessStatus =
  | "ready"
  | "needs-review"
  | "blocked"
  | "future";

export type MultiTrackAiPromptConfidenceLevel =
  | "high"
  | "medium"
  | "low"
  | "manual-required";

export type MultiTrackAiPromptOwner =
  | "user"
  | "manual-review"
  | "future-ai"
  | "future-analyzer"
  | "future-hybrid-builder";

export type MultiTrackAiPromptCategory =
  | "song-description"
  | "style-direction"
  | "hybrid-instruction"
  | "arrangement-instruction"
  | "stem-instruction"
  | "hook-instruction"
  | "lineage-question"
  | "training-feedback"
  | "safety-rule"
  | "export-note";

export type MultiTrackAiPromptInputSource =
  | "track-a"
  | "track-b"
  | "comparison"
  | "confidence"
  | "hybrid"
  | "training"
  | "manual-user-note"
  | "future-analysis";

export type MultiTrackAiPromptActionType =
  | "describe"
  | "compare"
  | "ask"
  | "recommend"
  | "rewrite"
  | "structure"
  | "warn"
  | "export";

export type MultiTrackAiPromptTemplate = {
  id: string;
  category: MultiTrackAiPromptCategory;
  actionType: MultiTrackAiPromptActionType;
  label: string;
  status: MultiTrackAiPromptReadinessStatus;
  confidence: MultiTrackAiPromptConfidenceLevel;
  owner: MultiTrackAiPromptOwner;
  purpose: string;
  templateText: string;
  requiredInputs: MultiTrackAiPromptInputSource[];
  userRule: string;
};

export type MultiTrackAiPromptInputRequirement = {
  id: string;
  inputSource: MultiTrackAiPromptInputSource;
  label: string;
  status: MultiTrackAiPromptReadinessStatus;
  confidence: MultiTrackAiPromptConfidenceLevel;
  detail: string;
  missingBehavior: string;
};

export type MultiTrackAiPromptOutputTarget = {
  id: string;
  label: string;
  category: MultiTrackAiPromptCategory;
  status: MultiTrackAiPromptReadinessStatus;
  owner: MultiTrackAiPromptOwner;
  outputPurpose: string;
  safetyNote: string;
};

export type MultiTrackAiPromptGuardrail = {
  id: string;
  label: string;
  status: MultiTrackAiPromptReadinessStatus;
  owner: MultiTrackAiPromptOwner;
  rule: string;
};

export type MultiTrackAiPromptWorkflowStep = {
  id: string;
  label: string;
  status: MultiTrackAiPromptReadinessStatus;
  owner: MultiTrackAiPromptOwner;
  purpose: string;
  blockedUntil: string;
};

export type MultiTrackAiPromptWorkspaceState = {
  title: string;
  description: string;
  templates: MultiTrackAiPromptTemplate[];
  inputRequirements: MultiTrackAiPromptInputRequirement[];
  outputTargets: MultiTrackAiPromptOutputTarget[];
  guardrails: MultiTrackAiPromptGuardrail[];
  workflowSteps: MultiTrackAiPromptWorkflowStep[];
};