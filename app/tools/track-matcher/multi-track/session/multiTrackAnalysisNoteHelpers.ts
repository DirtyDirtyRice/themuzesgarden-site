import {
  DEFAULT_MULTI_TRACK_ANALYSIS_NOTES,
} from "./multiTrackAnalysisNoteSeed";
import type {
  MultiTrackAnalysisNoteDraft,
  MultiTrackAnalysisNoteKind,
  MultiTrackAnalysisNotePriority,
  MultiTrackAnalysisNoteRecord,
  MultiTrackAnalysisNoteSnapshot,
} from "./multiTrackAnalysisNoteTypes";

export function createDefaultMultiTrackAnalysisNoteSnapshot(): MultiTrackAnalysisNoteSnapshot {
  return {
    notes: DEFAULT_MULTI_TRACK_ANALYSIS_NOTES.map((note) => ({
      ...note,
    })),
    selectedKind: "all",
  };
}

export function createMultiTrackAnalysisNote(
  draft: MultiTrackAnalysisNoteDraft,
): MultiTrackAnalysisNoteRecord {
  return {
    id: `analysis-note-${draft.kind}-${Date.now()}`,
    kind: draft.kind,
    priority: draft.priority,
    title: draft.title,
    body: draft.body,
    target: draft.target,
    status: "foundation",
  };
}

export function addMultiTrackAnalysisNote(
  snapshot: MultiTrackAnalysisNoteSnapshot,
  draft: MultiTrackAnalysisNoteDraft,
): MultiTrackAnalysisNoteSnapshot {
  return {
    ...snapshot,
    notes: [
      createMultiTrackAnalysisNote(draft),
      ...snapshot.notes,
    ],
  };
}

export function setMultiTrackAnalysisNoteKindFilter(
  snapshot: MultiTrackAnalysisNoteSnapshot,
  kind: MultiTrackAnalysisNoteKind | "all",
): MultiTrackAnalysisNoteSnapshot {
  return {
    ...snapshot,
    selectedKind: kind,
  };
}

export function getFilteredMultiTrackAnalysisNotes(
  snapshot: MultiTrackAnalysisNoteSnapshot,
): MultiTrackAnalysisNoteRecord[] {
  if (snapshot.selectedKind === "all") {
    return snapshot.notes;
  }

  return snapshot.notes.filter(
    (note) => note.kind === snapshot.selectedKind,
  );
}

export function createMultiTrackAnalysisNotePriorityLabel(
  priority: MultiTrackAnalysisNotePriority,
): string {
  if (priority === "high") return "High priority";
  if (priority === "medium") return "Medium priority";
  return "Low priority";
}

export function createMultiTrackAnalysisNoteSummary(
  notes: MultiTrackAnalysisNoteRecord[],
): string {
  const highCount = notes.filter((note) => note.priority === "high").length;
  const mediumCount = notes.filter((note) => note.priority === "medium").length;
  const lowCount = notes.filter((note) => note.priority === "low").length;

  return `${notes.length} notes / ${highCount} high / ${mediumCount} medium / ${lowCount} low`;
}