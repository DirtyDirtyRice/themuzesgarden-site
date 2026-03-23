export type MomentInspectorWorkspaceSelectionSummary = {
  selectedFamilyId: string | null;
  hasSelection: boolean;
  selectedLane: string | null;
  selectedCount: number;
  label: string;
};

function toText(value: unknown): string | null {
  const text = String(value ?? "").trim();
  return text || null;
}

function toTextList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => toText(item))
    .filter((item): item is string => Boolean(item));
}

function getSelectedFamilyIds(
  derivedState: any,
  filterState?: any
): string[] {
  const fromFilterState = toTextList(filterState?.selectedFamilyIds);
  if (fromFilterState.length) return fromFilterState;

  const fromDerivedState = toTextList(derivedState?.selectedFamilyIds);
  if (fromDerivedState.length) return fromDerivedState;

  const fromDerivedSelection = toTextList(derivedState?.selection?.selectedFamilyIds);
  if (fromDerivedSelection.length) return fromDerivedSelection;

  const singleSelectedFamilyId =
    toText(filterState?.selectedFamilyId) ??
    toText(derivedState?.selectedFamilyId) ??
    toText(derivedState?.selection?.familyId) ??
    null;

  return singleSelectedFamilyId ? [singleSelectedFamilyId] : [];
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

  const selectedFamilyIds = getSelectedFamilyIds(derivedState, filterState);
  const selectedCount = selectedFamilyIds.length || (selectedFamilyId ? 1 : 0);
  const hasSelection = selectedCount > 0;

  const label = hasSelection
    ? selectedCount === 1
      ? "1 family selected"
      : `${selectedCount} families selected`
    : "No selection";

  return {
    selectedFamilyId,
    hasSelection,
    selectedLane,
    selectedCount,
    label,
  };
}