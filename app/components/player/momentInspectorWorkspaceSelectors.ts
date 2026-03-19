export function getSelectedFamilyId(state: any): string | null {
  const id =
    state?.selectedFamilyId ??
    state?.selection?.familyId ??
    null;

  const text = String(id ?? "").trim();
  return text || null;
}

export function isFamilySelected(
  familyId: string,
  selectedId: string | null
): boolean {
  if (!familyId || !selectedId) return false;
  return familyId === selectedId;
}