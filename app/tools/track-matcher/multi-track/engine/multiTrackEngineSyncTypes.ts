import type {
  MultiTrackEngineReadinessLevel,
  MultiTrackEngineSyncStatus,
  MultiTrackEngineTrackSlotId,
} from "./multiTrackEngineTypes";

export type MultiTrackEngineSyncAnchorKind =
  | "start"
  | "downbeat"
  | "verse-entry"
  | "chorus-entry"
  | "drop"
  | "break"
  | "transition"
  | "custom";

export type MultiTrackEngineSyncConfidenceLevel =
  | "unknown"
  | "low"
  | "medium"
  | "high"
  | "locked";

export type MultiTrackEngineSyncAnchor = {
  id: string;
  kind: MultiTrackEngineSyncAnchorKind;
  label: string;
  trackSlotId: MultiTrackEngineTrackSlotId | "both";
  seconds: number;
  confidence: number;
  confidenceLevel: MultiTrackEngineSyncConfidenceLevel;
  locked: boolean;
  note: string;
};

export type MultiTrackEngineSyncCandidate = {
  id: string;
  label: string;
  trackASeconds: number;
  trackBSeconds: number;
  offsetSeconds: number;
  confidence: number;
  confidenceLevel: MultiTrackEngineSyncConfidenceLevel;
  detail: string;
  ready: boolean;
};

export type MultiTrackEngineSyncTransitionSuggestion = {
  id: string;
  label: string;
  fromTrackSlotId: MultiTrackEngineTrackSlotId;
  toTrackSlotId: MultiTrackEngineTrackSlotId;
  startSeconds: number;
  endSeconds: number;
  confidence: number;
  detail: string;
};

export type MultiTrackEngineSyncState = {
  readiness: MultiTrackEngineReadinessLevel;
  status: MultiTrackEngineSyncStatus;
  summary: string;
  bestCandidateLabel: string;
  averageConfidence: number;
  suggestedOffsetSeconds: number;
  anchors: MultiTrackEngineSyncAnchor[];
  candidates: MultiTrackEngineSyncCandidate[];
  transitionSuggestions: MultiTrackEngineSyncTransitionSuggestion[];
};