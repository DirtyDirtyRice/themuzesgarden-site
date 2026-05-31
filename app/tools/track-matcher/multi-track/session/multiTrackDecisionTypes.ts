import type { MultiTrackStatus } from "../multiTrackTypes";

export type MultiTrackDecisionKind =
  | "undecided"
  | "match"
  | "reference"
  | "hybrid"
  | "reject";

export type MultiTrackDecisionConfidence =
  | "unknown"
  | "low"
  | "medium"
  | "high";

export type MultiTrackDecisionRecord = {
  id: string;
  kind: MultiTrackDecisionKind;
  label: string;
  detail: string;
  confidence: MultiTrackDecisionConfidence;
  status: MultiTrackStatus;
};

export type MultiTrackDecisionOption = {
  kind: Exclude<MultiTrackDecisionKind, "undecided">;
  label: string;
  detail: string;
  saveRoute: string;
  promptRoute: string;
};

export type MultiTrackDecisionSnapshot = {
  activeDecision: MultiTrackDecisionRecord;
  options: MultiTrackDecisionOption[];
  history: MultiTrackDecisionRecord[];
};