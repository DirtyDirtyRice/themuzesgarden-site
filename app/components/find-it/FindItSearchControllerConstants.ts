export const MAX_FIND_IT_RESULTS = 16;
export const NAVIGATION_RESULT_LIMIT = 12;
export const SEARCH_DEBOUNCE_MS = 120;
export const PAGE_JUMP_SIZE = 5;

export const FIND_IT_SEARCH_MODE_LABELS = {
  idle: "Idle",
  debouncing: "Updating",
  no_results: "No results",
  single_result: "Single result",
  focused_results: "Focused results",
  compare_results: "Compare results",
  wide_results: "Wide results",
} as const;

export function getFindItSearchModeLabel(
  mode: keyof typeof FIND_IT_SEARCH_MODE_LABELS,
) {
  return FIND_IT_SEARCH_MODE_LABELS[mode];
}