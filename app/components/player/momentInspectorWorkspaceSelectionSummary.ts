export type MomentInspectorWorkspaceSelectionSummary = {
  selectedFamilyId: string | null;
  hasSelection: boolean;
  selectedLane: string | null;
};

function toText(value: unknown): string | null {
  const text = String(value ?? "").trim();
  return text || null;
}

export function buildMomentInspectorWorkspaceSelectionSummary(
  derivedState: any,
  filterState?: any
): MomentInspectorWorkspaceSelectionSummary {
  const selectedFamilyId =
    toText(filterState?.selectedFamilyId) ??
    toText(derivedState?.selectedFamilyId) ??
    toText(derivedState?.selection?.familyId) ??
    null;

  const selectedLane =
    toText(filterState?.selectedLane) ??
    toText(derivedState?.selectedLane) ??
    toText(derivedState?.selection?.lane) ??
    null;

  return {
    selectedFamilyId,
    hasSelection: Boolean(selectedFamilyId),
    selectedLane,
  };
}