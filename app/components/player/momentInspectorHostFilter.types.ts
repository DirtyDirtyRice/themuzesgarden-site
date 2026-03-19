  | "all"
  | "stable"
  | "watch"
  | "repair"
  | "blocked";

export type MomentInspectorRuntimeVerdictValue =
  | "stable"
  | "watch"
  | "repair"
  | "blocked";

export type MomentInspectorHostFilterOption = {
  value: MomentInspectorRuntimeVerdictFilter;
  label: string;
  description: string;
};

export type MomentInspectorHostFilterCounts = {
  all: number;
  stable: number;
  watch: number;
  repair: number;
  blocked: number;
};

export type MomentInspectorHostFilterState = {
  selectedVerdict: MomentInspectorRuntimeVerdictFilter;
};

export type MomentInspectorHostFilterSummary = {
  selectedVerdict: MomentInspectorRuntimeVerdictFilter;
  totalCount: number;
  visibleCount: number;
  hiddenCount: number;
  counts: MomentInspectorHostFilterCounts;
};

export type MomentInspectorHostFilterableFamily = {
  familyId: string;
  runtimeVerdict?: string | null;
};

export type MomentInspectorHostFilterResult<TFamily> = {
  selectedVerdict: MomentInspectorRuntimeVerdictFilter;
  counts: MomentInspectorHostFilterCounts;
  totalCount: number;
  visibleCount: number;
  hiddenCount: number;
  visibleFamilies: TFamily[];
  hiddenFamilies: TFamily[];
};