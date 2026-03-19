"use client";

function clamp01(value: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function formatRepeatHint(value: number | null): string {
  if (value === null || !Number.isFinite(value) || value <= 0) return "n/a";
  return `${value.toFixed(2)} sec`;
}

function formatScorePercent(value: number): string {
  return `${Math.round(clamp01(value) * 100)}%`;
}

function getCoverageScore(row: MomentInspectorRepeatSummaryRow): number {
  const total = row.presentCount + row.nearCount + row.missingCount;
  if (total <= 0) return 0;

  const weighted = row.presentCount * 1 + row.nearCount * 0.6;
  return weighted / total;
}

function getRowTone(row: MomentInspectorRepeatSummaryRow): string {
  if (row.missingCount > 0) return "border-red-100 bg-red-50";
  if (row.nearCount > 0) return "border-amber-100 bg-amber-50";
  return "border-emerald-100 bg-emerald-50";
}

function getCoverageTone(score: number): string {
  if (score >= 0.85) return "text-emerald-700";
  if (score >= 0.6) return "text-sky-700";
  if (score >= 0.4) return "text-amber-700";
  return "text-red-700";
}

export type MomentInspectorRepeatSummaryRow = {
  familyId: string;
  repeatInterval: number | null;
  presentCount: number;
  nearCount: number;
  missingCount: number;
};

export default function MomentInspectorRepeatSummaryPanel(props: {
  rows: MomentInspectorRepeatSummaryRow[];
}) {
  const { rows } = props;

  if (!rows.length) return null;

  return (
    <div className="mt-2 rounded border border-sky-200 bg-white px-2 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] font-medium uppercase tracking-wide text-sky-700">
          Intended Repeat Summary
        </div>
        <div className="text-[10px] text-sky-700">
          {rows.length} plan{rows.length === 1 ? "" : "s"}
        </div>
      </div>

      <div className="mt-1 space-y-1">
        {rows.slice(0, 6).map((row) => {
          const coverageScore = getCoverageScore(row);

          return (
            <div
              key={row.familyId}
              className={`flex items-center justify-between gap-2 rounded border px-2 py-1 text-[10px] ${getRowTone(
                row
              )}`}
            >
              <div className="min-w-0 truncate text-zinc-700">{row.familyId}</div>
              <div className="shrink-0 text-zinc-700">
                every {formatRepeatHint(row.repeatInterval)} • present {row.presentCount} • near{" "}
                {row.nearCount} • missing {row.missingCount} • coverage{" "}
                <span className={getCoverageTone(coverageScore)}>
                  {formatScorePercent(coverageScore)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}