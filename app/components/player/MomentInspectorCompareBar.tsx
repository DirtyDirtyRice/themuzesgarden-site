"use client";

import type {
  MomentInspectorCompareFamilyOption,
  MomentInspectorCompareState,
} from "./momentInspectorCompare.types";

export default function MomentInspectorCompareBar(props: {
  familyOptions: MomentInspectorCompareFamilyOption[];
  compareState: MomentInspectorCompareState;
  ready: boolean;
  reasons: string[];
  onChangePrimaryFamilyId: (familyId: string) => void;
  onChangeSecondaryFamilyId: (familyId: string) => void;
}) {
  const {
    familyOptions,
    compareState,
    ready,
    reasons,
    onChangePrimaryFamilyId,
    onChangeSecondaryFamilyId,
  } = props;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white/90 p-3">
      <div className="flex flex-col gap-3">
        <div>
          <div className="text-sm font-semibold text-zinc-900">
            Compare Families
          </div>
          <div className="text-xs text-zinc-600">
            Choose two families for side-by-side intelligence comparison.
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-700">Primary family</span>
            <select
              value={compareState.primaryFamilyId}
              onChange={(event) => onChangePrimaryFamilyId(event.target.value)}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800"
            >
              <option value="">Select family</option>
              {familyOptions.map((option) => (
                <option key={`primary-${option.familyId}`} value={option.familyId}>
                  {option.label || option.familyId}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-700">Secondary family</span>
            <select
              value={compareState.secondaryFamilyId}
              onChange={(event) => onChangeSecondaryFamilyId(event.target.value)}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800"
            >
              <option value="">Select family</option>
              {familyOptions.map((option) => (
                <option key={`secondary-${option.familyId}`} value={option.familyId}>
                  {option.label || option.familyId}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div
          className={`rounded-xl border px-3 py-2 text-xs ${
            ready
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          {ready ? (
            <span>Comparison ready.</span>
          ) : (
            <div className="flex flex-col gap-1">
              {reasons.map((reason) => (
                <span key={reason}>{reason}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}