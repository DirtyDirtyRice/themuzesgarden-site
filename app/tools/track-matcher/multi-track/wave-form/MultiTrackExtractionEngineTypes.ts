export type MultiTrackExtractionEngineReadiness =
  | "ready"
  | "needs-survivor"
  | "needs-drift-correction"
  | "needs-review"
  | "blocked"
  | "future";

export type MultiTrackExtractionEngineStatus =
  | "planned"
  | "estimated"
  | "seeded"
  | "missing"
  | "future";

export type MultiTrackExtractionEngineRisk =
  | "low"
  | "medium"
  | "high"
  | "blocked";

export type MultiTrackExtractionEngineDecision =
  | "extract"
  | "hold"
  | "review"
  | "reject"
  | "future";

export type MultiTrackExtractionEngineSourceKind =
  | "survivor-candidate"
  | "suno-version"
  | "original"
  | "stem"
  | "hybrid-render";

export type MultiTrackExtractionEngineCutRole =
  | "primary-hook"
  | "supporting-repeat"
  | "variation"
  | "pre-roll"
  | "post-roll"
  | "safety-tail"
  | "review-only";

export type MultiTrackExtractionEngineBoundaryKind =
  | "transient-anchor"
  | "survivor-window"
  | "manual-safe-margin"
  | "drift-corrected"
  | "section-boundary"
  | "unknown";

export type MultiTrackExtractionEngineBoundary = {
  boundaryId: string;
  kind: MultiTrackExtractionEngineBoundaryKind;
  label: string;
  timeMs: number;
  confidence: number;
  detail: string;
  status: MultiTrackExtractionEngineStatus;
  risk: MultiTrackExtractionEngineRisk;
};

export type MultiTrackExtractionEngineCutWindow = {
  cutWindowId: string;
  title: string;
  sourceCandidateId: string;
  sourceKind: MultiTrackExtractionEngineSourceKind;
  role: MultiTrackExtractionEngineCutRole;
  originalStartMs: number;
  originalEndMs: number;
  correctedStartMs: number;
  correctedEndMs: number;
  preRollMs: number;
  postRollMs: number;
  driftCorrectionMs: number;
  confidence: number;
  decision: MultiTrackExtractionEngineDecision;
  status: MultiTrackExtractionEngineStatus;
  risk: MultiTrackExtractionEngineRisk;
  boundaries: MultiTrackExtractionEngineBoundary[];
  notes: string[];
};

export type MultiTrackExtractionEngineReviewGate = {
  gateId: string;
  title: string;
  detail: string;
  pass: boolean;
  action: string;
  status: MultiTrackExtractionEngineStatus;
  risk: MultiTrackExtractionEngineRisk;
};

export type MultiTrackExtractionEnginePlan = {
  planId: string;
  title: string;
  cutWindowIds: string[];
  primaryCutWindowId: string;
  decision: MultiTrackExtractionEngineDecision;
  extractionScore: number;
  timingSafetyScore: number;
  reviewScore: number;
  detail: string;
  recommendation: string;
  status: MultiTrackExtractionEngineStatus;
  risk: MultiTrackExtractionEngineRisk;
};

export type MultiTrackExtractionEngineFinding = {
  findingId: string;
  title: string;
  detail: string;
  action: string;
  status: MultiTrackExtractionEngineStatus;
  risk: MultiTrackExtractionEngineRisk;
};

export type MultiTrackExtractionEngineWorkspace = {
  workspaceId: string;
  title: string;
  summary: string;
  readiness: MultiTrackExtractionEngineReadiness;
  readinessLabel: string;
  engineGoal: string;
  engineBoundary: string;
  cutWindows: MultiTrackExtractionEngineCutWindow[];
  plans: MultiTrackExtractionEnginePlan[];
  reviewGates: MultiTrackExtractionEngineReviewGate[];
  findings: MultiTrackExtractionEngineFinding[];
  engineRules: string[];
  nextSteps: string[];
};
