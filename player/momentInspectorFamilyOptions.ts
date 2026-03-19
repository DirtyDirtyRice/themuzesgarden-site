import { normalizeInspectorText } from "./momentInspectorRuntimeAccess";

export function buildMomentInspectorFamilyOptions(params: {
  repairFamilyIds: string[];
  actionFamilyIds: string[];
  stabilityFamilyIds: string[];
  driftFamilyIds: string[];
}): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of [
    ...params.repairFamilyIds,
    ...params.actionFamilyIds,
    ...params.stabilityFamilyIds,
    ...params.driftFamilyIds,
  ]) {
    const clean = normalizeInspectorText(value);

    if (!clean || seen.has(clean)) continue;

    seen.add(clean);
    result.push(clean);
  }

  return result;
}