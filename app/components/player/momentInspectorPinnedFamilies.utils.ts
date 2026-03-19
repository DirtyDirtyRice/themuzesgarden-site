import type {
  MomentInspectorPinnedFamiliesResult,
  MomentInspectorPinnedFamiliesSummary,
} from "./momentInspectorPinnedFamilies.types";

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

export function normalizePinnedFamilyId(value: unknown): string {
  return normalizeText(value);
}

export function normalizePinnedFamilyIds(values: unknown[]): string[] {
  const unique = new Set<string>();

  for (const value of values) {
    const familyId = normalizePinnedFamilyId(value);
    if (familyId) {
      unique.add(familyId);
    }
  }

  return Array.from(unique);
}

export function isPinnedFamily(
  familyId: unknown,
  pinnedFamilyIds: string[]
): boolean {
  const cleanId = normalizePinnedFamilyId(familyId);
  if (!cleanId) return false;
  return pinnedFamilyIds.includes(cleanId);
}

export function togglePinnedFamilyId(
  pinnedFamilyIds: string[],
  familyId: unknown
): string[] {
  const cleanId = normalizePinnedFamilyId(familyId);
  if (!cleanId) return normalizePinnedFamilyIds(pinnedFamilyIds);

  if (pinnedFamilyIds.includes(cleanId)) {
    return pinnedFamilyIds.filter((id) => id !== cleanId);
  }

  return normalizePinnedFamilyIds([...pinnedFamilyIds, cleanId]);
}

export function addPinnedFamilyId(
  pinnedFamilyIds: string[],
  familyId: unknown
): string[] {
  const cleanId = normalizePinnedFamilyId(familyId);
  if (!cleanId) return normalizePinnedFamilyIds(pinnedFamilyIds);
  return normalizePinnedFamilyIds([...pinnedFamilyIds, cleanId]);
}

export function removePinnedFamilyId(
  pinnedFamilyIds: string[],
  familyId: unknown
): string[] {
  const cleanId = normalizePinnedFamilyId(familyId);
  if (!cleanId) return normalizePinnedFamilyIds(pinnedFamilyIds);
  return pinnedFamilyIds.filter((id) => id !== cleanId);
}

export function filterPinnedFamilies<
  TFamily extends {
    familyId: string;
  }
>(families: TFamily[], pinnedFamilyIds: string[], pinnedOnly: boolean): TFamily[] {
  if (!pinnedOnly) {
    return families;
  }

  return families.filter((family) =>
    isPinnedFamily(family.familyId, pinnedFamilyIds)
  );
}

export function buildMomentInspectorPinnedFamiliesResult<
  TFamily extends {
    familyId: string;
  }
>(
  families: TFamily[],
  pinnedFamilyIds: string[],
  pinnedOnly: boolean
): MomentInspectorPinnedFamiliesResult<TFamily> {
  const normalizedPinnedFamilyIds = normalizePinnedFamilyIds(pinnedFamilyIds);
  const visibleFamilies = filterPinnedFamilies(
    families,
    normalizedPinnedFamilyIds,
    pinnedOnly
  );
  const visibleIdSet = new Set(visibleFamilies.map((family) => family.familyId));
  const hiddenFamilies = families.filter(
    (family) => !visibleIdSet.has(family.familyId)
  );
  const pinnedCount = families.filter((family) =>
    isPinnedFamily(family.familyId, normalizedPinnedFamilyIds)
  ).length;
  const totalCount = families.length;
  const visibleCount = visibleFamilies.length;
  const hiddenCount = Math.max(0, totalCount - visibleCount);

  return {
    pinnedFamilyIds: normalizedPinnedFamilyIds,
    pinnedOnly,
    totalCount,
    pinnedCount,
    visibleCount,
    hiddenCount,
    visibleFamilies,
    hiddenFamilies,
  };
}

export function buildMomentInspectorPinnedFamiliesSummary<
  TFamily extends {
    familyId: string;
  }
>(
  families: TFamily[],
  pinnedFamilyIds: string[],
  pinnedOnly: boolean
): MomentInspectorPinnedFamiliesSummary {
  const result = buildMomentInspectorPinnedFamiliesResult(
    families,
    pinnedFamilyIds,
    pinnedOnly
  );

  return {
    pinnedFamilyIds: result.pinnedFamilyIds,
    pinnedOnly: result.pinnedOnly,
    totalCount: result.totalCount,
    pinnedCount: result.pinnedCount,
    visibleCount: result.visibleCount,
    hiddenCount: result.hiddenCount,
  };
}