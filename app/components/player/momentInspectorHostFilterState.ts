import { MOMENT_INSPECTOR_HOST_FILTER_DEFAULT } from "./momentInspectorHostFilterOptions";
import type {
  MomentInspectorHostFilterResult,
  MomentInspectorHostFilterState,
  MomentInspectorHostFilterSummary,
  MomentInspectorHostFilterableFamily,
  MomentInspectorRuntimeVerdictFilter,
} from "./momentInspectorHostFilter.types";
import {
  buildMomentInspectorHostFilterResult,
  buildMomentInspectorHostFilterSummary,
} from "./momentInspectorHostFilter.utils";

export function normalizeMomentInspectorHostFilterValue(
  value: unknown
): MomentInspectorRuntimeVerdictFilter {
  if (value === "stable") return "stable";
  if (value === "watch") return "watch";
  if (value === "repair") return "repair";
  if (value === "blocked") return "blocked";
  return "all";
}

export function createMomentInspectorHostFilterState(
  selectedVerdict?: unknown
): MomentInspectorHostFilterState {
  return {
    selectedVerdict: normalizeMomentInspectorHostFilterValue(
      selectedVerdict ?? MOMENT_INSPECTOR_HOST_FILTER_DEFAULT
    ),
  };
}

export function setMomentInspectorHostFilterVerdict(
  currentState: MomentInspectorHostFilterState,
  nextVerdict: unknown
): MomentInspectorHostFilterState {
  return {
    ...currentState,
    selectedVerdict: normalizeMomentInspectorHostFilterValue(nextVerdict),
  };
}

export function resetMomentInspectorHostFilterState(): MomentInspectorHostFilterState {
  return createMomentInspectorHostFilterState(
    MOMENT_INSPECTOR_HOST_FILTER_DEFAULT
  );
}

export function buildMomentInspectorHostFilterStateResult<
  TFamily extends MomentInspectorHostFilterableFamily
>(
  families: TFamily[],
  state: MomentInspectorHostFilterState
): MomentInspectorHostFilterResult<TFamily> {
  return buildMomentInspectorHostFilterResult(
    families,
    state.selectedVerdict
  );
}

export function buildMomentInspectorHostFilterStateSummary<
  TFamily extends MomentInspectorHostFilterableFamily
>(
  families: TFamily[],
  state: MomentInspectorHostFilterState
): MomentInspectorHostFilterSummary {
  return buildMomentInspectorHostFilterSummary(
    families,
    state.selectedVerdict
  );
}