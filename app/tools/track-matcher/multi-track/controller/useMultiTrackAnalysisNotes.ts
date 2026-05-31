"use client";

import { useMemo, useState } from "react";
import {
  addMultiTrackAnalysisNote,
  createDefaultMultiTrackAnalysisNoteSnapshot,
  createMultiTrackAnalysisNoteSummary,
  getFilteredMultiTrackAnalysisNotes,
  setMultiTrackAnalysisNoteKindFilter,
} from "../session/multiTrackAnalysisNoteHelpers";
import type {
  MultiTrackAnalysisNoteDraft,
  MultiTrackAnalysisNoteKind,
} from "../session/multiTrackAnalysisNoteTypes";

export function useMultiTrackAnalysisNotes() {
  const [noteSnapshot, setNoteSnapshot] = useState(
    createDefaultMultiTrackAnalysisNoteSnapshot,
  );

  function addNote(draft: MultiTrackAnalysisNoteDraft) {
    setNoteSnapshot((current) =>
      addMultiTrackAnalysisNote(current, draft),
    );
  }

  function setSelectedKind(kind: MultiTrackAnalysisNoteKind | "all") {
    setNoteSnapshot((current) =>
      setMultiTrackAnalysisNoteKindFilter(current, kind),
    );
  }

  const filteredNotes = useMemo(
    () => getFilteredMultiTrackAnalysisNotes(noteSnapshot),
    [noteSnapshot],
  );

  const summary = useMemo(
    () => createMultiTrackAnalysisNoteSummary(noteSnapshot.notes),
    [noteSnapshot.notes],
  );

  return {
    addNote,
    filteredNotes,
    noteSnapshot,
    selectedKind: noteSnapshot.selectedKind,
    setSelectedKind,
    summary,
  };
}