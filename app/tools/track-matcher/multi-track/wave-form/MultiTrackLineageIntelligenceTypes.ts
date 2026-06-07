export type MultiTrackLineageReadinessStatus =
  | "ready"
  | "needs-review"
  | "blocked"
  | "future";

export type MultiTrackLineageSourceType =
  | "original-phone-recording"
  | "demo"
  | "suno-generation"
  | "stem-export"
  | "master-export"
  | "reference-track"
  | "hybrid-output"
  | "manual-note"
  | "future-ai";

export type MultiTrackLineageRelationshipType =
  | "parent"
  | "child"
  | "sibling"
  | "reference"
  | "derived-from"
  | "inspired-by"
  | "same-session"
  | "same-song-family"
  | "unknown"
  | "future";

export type MultiTrackLineageEvidenceSource =
  | "filename"
  | "metadata"
  | "library-link"
  | "project-link"
  | "stem-ownership"
  | "comparison"
  | "confidence"
  | "manual-review"
  | "future-ai";

export type MultiTrackLineageConfidenceLevel =
  | "verified"
  | "strong"
  | "moderate"
  | "weak"
  | "unknown"
  | "future";

export type MultiTrackLineageRisk =
  | "missing-original"
  | "missing-generation-link"
  | "missing-stem-map"
  | "filename-only"
  | "weak-confidence"
  | "unverified-claim"
  | "needs-human-review"
  | "future-only";

export type MultiTrackLineageNode = {
  id: string;
  title: string;
  sourceType: MultiTrackLineageSourceType;
  readinessStatus: MultiTrackLineageReadinessStatus;
  confidenceLevel: MultiTrackLineageConfidenceLevel;
  evidenceSource: MultiTrackLineageEvidenceSource;
  description: string;
  notes: string;
  risks: MultiTrackLineageRisk[];
};

export type MultiTrackLineageRelationship = {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  relationshipType: MultiTrackLineageRelationshipType;
  readinessStatus: MultiTrackLineageReadinessStatus;
  confidenceLevel: MultiTrackLineageConfidenceLevel;
  evidenceSource: MultiTrackLineageEvidenceSource;
  explanation: string;
  risks: MultiTrackLineageRisk[];
};

export type MultiTrackLineageChain = {
  id: string;
  title: string;
  description: string;
  nodeIds: string[];
  relationshipIds: string[];
  readinessStatus: MultiTrackLineageReadinessStatus;
  reviewNote: string;
};

export type MultiTrackLineageReviewLane = {
  id: string;
  title: string;
  description: string;
  status: MultiTrackLineageReadinessStatus;
  nodeIds: string[];
  relationshipIds: string[];
  requiredEvidence: MultiTrackLineageEvidenceSource[];
  reviewNote: string;
};

export type MultiTrackLineageChecklistItem = {
  id: string;
  label: string;
  status: MultiTrackLineageReadinessStatus;
  detail: string;
};

export type MultiTrackLineageWorkspaceState = {
  title: string;
  description: string;
  status: MultiTrackLineageReadinessStatus;
  nodes: MultiTrackLineageNode[];
  relationships: MultiTrackLineageRelationship[];
  chains: MultiTrackLineageChain[];
  reviewLanes: MultiTrackLineageReviewLane[];
  checklist: MultiTrackLineageChecklistItem[];
};