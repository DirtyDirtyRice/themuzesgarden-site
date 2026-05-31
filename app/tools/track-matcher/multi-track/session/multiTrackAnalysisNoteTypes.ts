import type { MultiTrackStatus } from "../multiTrackTypes";

export type MultiTrackAnalysisNoteKind =
  | "listening"
  | "arrangement"
  | "timeline"
  | "decision"
  | "metadata"
  | "prompt"
  | "ai";

export type MultiTrackAnalysisNotePriority =
  | "low"
  | "medium"
  | "high";

export type MultiTrackAnalysisNoteRecord = {
  id: string;
  kind: MultiTrackAnalysisNoteKind;
  priority: MultiTrackAnalysisNotePriority;
  title: string;
  body: string;
  target: "track-a" | "track-b" | "pair" | "session";
  status: MultiTrackStatus;
};

export type MultiTrackAnalysisNoteDraft = {
  kind: MultiTrackAnalysisNoteKind;
  priority: MultiTrackAnalysisNotePriority;
  title: string;
  body: string;
  target: MultiTrackAnalysisNoteRecord["target"];
};

export type MultiTrackAnalysisNoteSnapshot = {
  notes: MultiTrackAnalysisNoteRecord[];
  selectedKind: MultiTrackAnalysisNoteKind | "all";
};