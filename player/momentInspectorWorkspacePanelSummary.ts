export type MomentInspectorWorkspacePanelSummary = {
  totalFamilies: number;
  watchCount: number;
  repairCount: number;
  selectedFamilyId: string | null;
  selectedCount: number;
  hasSelection: boolean;
  hasFamilies: boolean;
};

function toCount(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

function toArrayCount(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function toText(value: unknown): string {
  return String(value ?? "").trim();
}

export function buildMomentInspectorWorkspacePanelSummary(
  derivedState: any,
  filterState?: any
): MomentInspectorWorkspacePanelSummary {
  const watchFamilies =
    derivedState?.watchFamilies ??
    derivedState?.watchQueue ??
    derivedState?.lanes?.watch ??
    [];

  const repairFamilies =
    derivedState?.repairFamilies ??
    derivedState?.repairQueue ??
    derivedState?.lanes?.repair ??
    [];

  const watchCount =
    toCount(derivedState?.watchCount) || toArrayCount(watchFamilies);

  const repairCount =
    toCount(derivedState?.repairCount) || toArrayCount(repairFamilies);

  const totalFamilies =
    toCount(derivedState?.totalFamilies) || watchCount + repairCount;

  const selectedFamilyId =
    toText(filterState?.selectedFamilyId) ||
    toText(derivedState?.selectedFamilyId) ||
    toText(derivedState?.selection?.familyId) ||
    null;

  return {
    totalFamilies,
    watchCount,
    repairCount,
    selectedFamilyId,
    selectedCount: selectedFamilyId ? 1 : 0,
    hasSelection: Boolean(selectedFamilyId),
    hasFamilies: totalFamilies > 0,
  };
}