"use client";

import { MOMENT_INSPECTOR_HOST_FILTER_OPTIONS } from "./momentInspectorHostFilterOptions";
import type {
  MomentInspectorHostFilterCounts,
  MomentInspectorRuntimeVerdictFilter,
} from "./momentInspectorHostFilter.types";
import { getRuntimeVerdictFilterChipLabel } from "./momentInspectorHostFilter.utils";

function getButtonTone(params: {
  value: MomentInspectorRuntimeVerdictFilter;
  selectedValue: MomentInspectorRuntimeVerdictFilter;
}): string {
  const { value, selectedValue } = params;
  const isActive = value === selectedValue;

  if (isActive && value === "stable") {
    return "border-emerald-300 bg-emerald-50 text-emerald-800";
  }

  if (isActive && value === "watch") {
    return "border-amber-300 bg-amber-50 text-amber-800";
  }

  if (isActive && value === "repair") {
    return "border-red-300 bg-red-50 text-red-800";
  }

  if (isActive && value === "blocked") {
    return "border-zinc-400 bg-zinc-200 text-zinc-900";
  }

  if (isActive && value === "all") {
    return "border-sky-300 bg-sky-50 text-sky-800";
  }

  return "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50";
}

export default function MomentInspectorHostFilterBar(props: {
  selectedVerdict: MomentInspectorRuntimeVerdictFilter;
  counts: MomentInspectorHostFilterCounts;
  visibleCount: number;
  totalCount: number;
  onChange: (nextVerdict: MomentInspectorRuntimeVerdictFilter) => void;
}) {
  const { selectedVerdict, counts, visibleCount, totalCount, onChange } = props;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white/90 p-3">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {MOMENT_INSPECTOR_HOST_FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${getButtonTone(
                {
                  value: option.value,
                  selectedValue: selectedVerdict,
                }
              )}`}
              title={option.description}
              aria-pressed={option.value === selectedVerdict}
            >
              {getRuntimeVerdictFilterChipLabel(option.value, counts)}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-600">
          <span>
            Showing{" "}
            <span className="font-semibold text-zinc-900">{visibleCount}</span>{" "}
            of{" "}
            <span className="font-semibold text-zinc-900">{totalCount}</span>{" "}
            families
          </span>

          {visibleCount !== totalCount ? (
            <span>
              Hidden{" "}
              <span className="font-semibold text-zinc-900">
                {Math.max(0, totalCount - visibleCount)}
              </span>
            </span>
          ) : null}

          <span>
            Active filter:{" "}
            <span className="font-semibold text-zinc-900">
              {selectedVerdict}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}