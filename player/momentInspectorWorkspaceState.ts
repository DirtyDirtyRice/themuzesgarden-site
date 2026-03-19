"use client";

import { useMemo, useState } from "react";
import { buildWorkspaceDerivedState } from "./momentInspectorWorkspace.utils";
import type {
  MomentInspectorWorkspaceLane,
  MomentInspectorWorkspaceSortMode,
  MomentInspectorWorkspaceStateParams,
} from "./momentInspectorWorkspace.types";

export function useMomentInspectorWorkspaceState(
  params: MomentInspectorWorkspaceStateParams
) {
  const [activeLane, setActiveLane] = useState<MomentInspectorWorkspaceLane>(
    params.initialLane ?? "watch"
  );

  const [searchQuery, setSearchQuery] = useState<string>(
    params.initialSearchQuery ?? ""
  );

  const [sortMode] = useState<MomentInspectorWorkspaceSortMode>(
    params.initialSortMode ?? "priority"
  );

  const derived = useMemo(() => {
    return buildWorkspaceDerivedState({
      familySources: params.familySources ?? [],
      activeLane,
      searchQuery,
      sortMode,
    });
  }, [params.familySources, activeLane, searchQuery, sortMode]);

  return {
    state: derived,
    actions: {
      setActiveLane,
      setSearchQuery,
      clearSearchQuery: () => setSearchQuery(""),
    },
  };
}