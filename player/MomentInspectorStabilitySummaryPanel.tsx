"use client";

import {
  getPhraseStabilityLabelUi,
  type InspectorPhraseStabilityFamilyRow,
} from "./momentInspectorPhraseStabilityView";

function clampNumber(value: number, min: number, max: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

function formatWholePercent(value: number): string {
  return `${Math.round(clampNumber(value, 0, 100))}%`;
}

export default function MomentInspectorStabilitySummaryPanel(props: {
  rows: InspectorPhraseStabilityFamilyRow[];
}) {
  const { rows } = props;

  if (!rows || !rows.length) return null;

  const visibleRows = rows.slice(0, 6);

  return (
    <div className="mt-2 rounded border border-emerald-200 bg-white px-2 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] font-medium uppercase tracking-wide text-emerald-700">
          Phrase Stability Summary
        </div>

        <div className="text-[10px] text-emerald-700">
          {rows.length} famil{rows.length === 1 ? "y" : "ies"}
        </div>
      </div>

      <div className="mt-1 space-y-1">
        {visibleRows.map((row) => (
          <div
            key={row.familyId}
            className="flex items-center justify-between gap-2 rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-[10px]"
          >
            <div className="min-w-0 truncate text-zinc-700">{row.familyId}</div>

            <div className="shrink-0 text-zinc-700">
              {getPhraseStabilityLabelUi(row.stabilityLabel)}
              {` • score ${formatWholePercent(row.stabilityScore)} • conf ${formatWholePercent(
                row.structuralConfidence
              )} • issues ${row.issueFlags.length}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}