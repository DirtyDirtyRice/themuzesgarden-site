export type MomentInspectorWorkspaceSelectionState = {
  selectedFamilyIds: string[];
};

export function createEmptyWorkspaceSelection(): MomentInspectorWorkspaceSelectionState {
  return {
    selectedFamilyIds: [],
  };
}

export function toggleWorkspaceSelection(
  state: MomentInspectorWorkspaceSelectionState,
  familyId: string
): MomentInspectorWorkspaceSelectionState {
  const exists = state.selectedFamilyIds.includes(familyId);

  return {
    selectedFamilyIds: exists
      ? state.selectedFamilyIds.filter((id) => id !== familyId)
      : [...state.selectedFamilyIds, familyId],
  };
}

export function clearWorkspaceSelection(): MomentInspectorWorkspaceSelectionState {
  return {
    selectedFamilyIds: [],
  };
}

export function isWorkspaceSelected(
  state: MomentInspectorWorkspaceSelectionState,
  familyId: string
): boolean {
  return state.selectedFamilyIds.includes(familyId);
}