import type {
  MomentInspectorHostFilterOption,
  MomentInspectorRuntimeVerdictFilter,
} from "./momentInspectorHostFilter.types";

export const MOMENT_INSPECTOR_HOST_FILTER_OPTIONS: MomentInspectorHostFilterOption[] =
  [
    {
      value: "all",
      label: "All",
      description: "Show every phrase family.",
    },
    {
      value: "stable",
      label: "Stable",
      description: "Show only families marked stable.",
    },
    {
      value: "watch",
      label: "Watch",
      description: "Show only families that should be watched.",
    },
    {
      value: "repair",
      label: "Repair",
      description: "Show only families that need repair attention.",
    },
    {
      value: "blocked",
      label: "Blocked",
      description: "Show only families that are blocked.",
    },
  ];

export const MOMENT_INSPECTOR_HOST_FILTER_DEFAULT: MomentInspectorRuntimeVerdictFilter =
  "all";