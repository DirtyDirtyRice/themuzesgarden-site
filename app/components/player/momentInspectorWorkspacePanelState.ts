"use client";

import { useMemo, useState } from "react";
import { useMomentInspectorWorkspaceState } from "./momentInspectorWorkspaceState";
import {
  createMomentInspectorWorkspaceToolbarState,
  updateMomentInspectorWorkspaceToolbarFilters,
  updateMomentInspectorWorkspaceToolbarViewOptions,
} from "./momentInspectorWorkspaceToolbarState";
import {
  clearWorkspaceSelection,
  createEmptyWorkspaceSelection,
  toggleWorkspaceSelection,
} from "./momentInspectorWorkspaceSelection";
import type { MomentInspectorWorkspacePanelProps } from "./momentInspectorWorkspace.types";

export function useMomentInspectorWorkspacePanelState(
  props: MomentInspectorWorkspacePanelProps
) {
  const { state, actions } = useMomentInspectorWorkspaceState({
    familySources: props.familySources ?? [],
    initialLane: props.initialLane ?? "watch",
    initialSearchQuery: props.initialSearchQuery ?? "",
    initialSortMode: props.initialSortMode ?? "priority",
  });

  const [toolbarState, setToolbarState] = useState(
    createMomentInspectorWorkspaceToolbarState()
  );

  const [selection, setSelection] = useState(createEmptyWorkspaceSelection());

  const runtime = useMemo(() => {
    return {
      activeLane: state.activeLane,
      searchQuery: state.searchQuery,
      sortMode: toolbarState.viewOptions.sortMode,
      groupMode: toolbarState.viewOptions.groupMode,
      filters: toolbarState.filters,
      selection,
    };
  }, [state.activeLane, state.searchQuery, toolbarState, selection]);

  return {
    state,
    runtime,
    actions: {
      onLaneChange: actions.setActiveLane,
      onSearchQueryChange: actions.setSearchQuery,
      onSortModeChange: (value: typeof toolbarState.viewOptions.sortMode) =>
        setToolbarState((current) =>
          updateMomentInspectorWorkspaceToolbarViewOptions(current, {
            ...current.viewOptions,
            sortMode: value,
          })
        ),
      onGroupModeChange: (value: typeof toolbarState.viewOptions.groupMode) =>
        setToolbarState((current) =>
          updateMomentInspectorWorkspaceToolbarViewOptions(current, {
            ...current.viewOptions,
            groupMode: value,
          })
        ),
      onFiltersChange: (filters: typeof toolbarState.filters) =>
        setToolbarState((current) =>
          updateMomentInspectorWorkspaceToolbarFilters(current, filters)
        ),
      onToggleSelected: (familyId: string) =>
        setSelection((current) => toggleWorkspaceSelection(current, familyId)),
      onClearSelection: () => setSelection(clearWorkspaceSelection()),
    },
  };
}