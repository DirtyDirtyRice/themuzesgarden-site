import type {
  MomentInspectorHostFilterCounts,
  MomentInspectorHostFilterResult,
  MomentInspectorHostFilterSummary,
  MomentInspectorHostFilterableFamily,
  MomentInspectorRuntimeVerdictFilter,
  MomentInspectorRuntimeVerdictValue,
} from "./momentInspectorHostFilter.types";

function normalizeText(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

export function normalizeRuntimeVerdict(
  value: unknown
): MomentInspectorRuntimeVerdictValue | null {
  const clean = normalizeText(value);

  if (clean === "stable") return "stable";
  if (clean === "watch") return "watch";
  if (clean === "repair") return "repair";
  if (clean === "blocked") return "blocked";

  return null;
}

export function createEmptyHostFilterCounts(): MomentInspectorHostFilterCounts {
  return {
    all: 0,
    stable: 0,
    watch: 0,
    repair: 0,
    blocked: 0,
  };
}

export function getRuntimeVerdictFilterCounts<
  TFamily extends MomentInspectorHostFilterableFamily
>(families: TFamily[]): MomentInspectorHostFilterCounts {
  const counts = createEmptyHostFilterCounts();

  for (const family of families) {
    counts.all += 1;

    const verdict = normalizeRuntimeVerdict(family.runtimeVerdict);

    if (verdict === "stable") counts.stable += 1;
    if (verdict === "watch") counts.watch += 1;
    if (verdict === "repair") counts.repair += 1;
    if (verdict === "blocked") counts.blocked += 1;
  }

  return counts;
}

export function doesFamilyMatchRuntimeVerdictFilter(
  runtimeVerdict: unknown,
  selectedVerdict: MomentInspectorRuntimeVerdictFilter
): boolean {
  if (selectedVerdict === "all") {
    return true;
  }

  return normalizeRuntimeVerdict(runtimeVerdict) === selectedVerdict;
}

export function filterFamiliesByRuntimeVerdict<
  TFamily extends MomentInspectorHostFilterableFamily
>(
  families: TFamily[],
  selectedVerdict: MomentInspectorRuntimeVerdictFilter
): TFamily[] {
  return families.filter((family) =>
    doesFamilyMatchRuntimeVerdictFilter(
      family.runtimeVerdict,
      selectedVerdict
    )
  );
}

export function buildMomentInspectorHostFilterResult<
  TFamily extends MomentInspectorHostFilterableFamily
>(
  families: TFamily[],
  selectedVerdict: MomentInspectorRuntimeVerdictFilter
): MomentInspectorHostFilterResult<TFamily> {
  const counts = getRuntimeVerdictFilterCounts(families);
  const visibleFamilies = filterFamiliesByRuntimeVerdict(
    families,
    selectedVerdict
  );
  const visibleIds = new Set(visibleFamilies.map((family) => family.familyId));
  const hiddenFamilies = families.filter(
    (family) => !visibleIds.has(family.familyId)
  );
  const totalCount = families.length;
  const visibleCount = visibleFamilies.length;
  const hiddenCount = Math.max(0, totalCount - visibleCount);

  return {
    selectedVerdict,
    counts,
    totalCount,
    visibleCount,
    hiddenCount,
    visibleFamilies,
    hiddenFamilies,
  };
}

export function buildMomentInspectorHostFilterSummary<
  TFamily extends MomentInspectorHostFilterableFamily
>(
  families: TFamily[],
  selectedVerdict: MomentInspectorRuntimeVerdictFilter
): MomentInspectorHostFilterSummary {
  const result = buildMomentInspectorHostFilterResult(
    families,
    selectedVerdict
  );

  return {
    selectedVerdict: result.selectedVerdict,
    totalCount: result.totalCount,
    visibleCount: result.visibleCount,
    hiddenCount: result.hiddenCount,
    counts: result.counts,
  };
}

export function getRuntimeVerdictFilterChipLabel(
  filter: MomentInspectorRuntimeVerdictFilter,
  counts: MomentInspectorHostFilterCounts
): string {
  if (filter === "all") return `All (${counts.all})`;
  if (filter === "stable") return `Stable (${counts.stable})`;
  if (filter === "watch") return `Watch (${counts.watch})`;
  if (filter === "repair") return `Repair (${counts.repair})`;
  return `Blocked (${counts.blocked})`;
}