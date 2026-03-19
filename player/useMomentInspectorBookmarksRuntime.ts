"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addMomentInspectorBookmark,
  buildMomentInspectorBookmarkOptions,
  createMomentInspectorBookmarksState,
  getMomentInspectorBookmarkById,
  removeMomentInspectorBookmark,
} from "./momentInspectorBookmarksState";
import {
  loadMomentInspectorBookmarksState,
  saveMomentInspectorBookmarksState,
} from "./momentInspectorBookmarksStorage";

export function useMomentInspectorBookmarksRuntime(params: {
  selectedTrackId: string;
  selectedPhraseFamilyId: string;
  selectedVerdict: any;
  pinnedFamilyIds: string[];
  pinnedOnly: boolean;
  comparePrimaryFamilyId: string;
  compareSecondaryFamilyId: string;
  setTrackId: (id: string) => void;
  setSelectedPhraseFamilyId: (id: string) => void;
  setHostFilterState: (fn: any) => void;
  setPinnedState: (state: any) => void;
  setCompareState: (state: any) => void;
}) {
  const {
    selectedTrackId,
    selectedPhraseFamilyId,
    selectedVerdict,
    pinnedFamilyIds,
    pinnedOnly,
    comparePrimaryFamilyId,
    compareSecondaryFamilyId,
    setTrackId,
    setSelectedPhraseFamilyId,
    setHostFilterState,
    setPinnedState,
    setCompareState,
  } = params;

  const [state, setState] = useState(() =>
    createMomentInspectorBookmarksState([])
  );

  useEffect(() => {
    setState(loadMomentInspectorBookmarksState());
  }, []);

  useEffect(() => {
    saveMomentInspectorBookmarksState(state);
  }, [state]);

  const options = useMemo(() => {
    return buildMomentInspectorBookmarkOptions(state);
  }, [state]);

  function save(label: string) {
    setState((current) =>
      addMomentInspectorBookmark(current, {
        label,
        snapshot: {
          selectedTrackId,
          selectedPhraseFamilyId,
          selectedVerdict,
          pinnedFamilyIds,
          pinnedOnly,
          comparePrimaryFamilyId,
          compareSecondaryFamilyId,
        },
      })
    );
  }

  function load(id: string) {
    const bookmark = getMomentInspectorBookmarkById(state, id);
    if (!bookmark) return;

    const snap = bookmark.snapshot;

    if (snap.selectedTrackId) {
      setTrackId(snap.selectedTrackId);
    }

    setSelectedPhraseFamilyId(snap.selectedPhraseFamilyId);

    setHostFilterState((s: any) => ({
      ...s,
      selectedVerdict: snap.selectedVerdict,
    }));

    setPinnedState({
      pinnedFamilyIds: snap.pinnedFamilyIds,
      pinnedOnly: snap.pinnedOnly,
    });

    setCompareState({
      primaryFamilyId: snap.comparePrimaryFamilyId,
      secondaryFamilyId: snap.compareSecondaryFamilyId,
    });
  }

  function remove(id: string) {
    setState((current) =>
      removeMomentInspectorBookmark(current, id)
    );
  }

  return {
    bookmarkOptions: options,
    saveBookmark: save,
    loadBookmark: load,
    deleteBookmark: remove,
  };
}