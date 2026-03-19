"use client";

function clamp01(value: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function formatScorePercent(value: number): string {
  const pct = Math.round(clamp01(value) * 100);
  return `${pct}%`;
}

export type MomentInspectorActionSummaryRow = {
  familyId: string;
  totalActions: number;
  missingActions: number;
  nearActions: number;
  presentActions: number;
  topConfidence: number;
};

export default function MomentInspectorActionSummaryPanel(props: {
  rows: MomentInspectorActionSummaryRow[];
}) {
  const { rows } = props;

  if (!rows || !rows.length) return null;

  const visibleRows = rows.slice(0, 6);

  return (
    <div className="mt-2 rounded border border-sky-200 bg-white px-2 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] font-medium uppercase tracking-wide text-sky-700">
          Intended Action Summary
        </div>

        <div className="text-[10px] text-sky-700">
          {rows.length} famil{rows.length === 1 ? "y" : "ies"}
        </div>
      </div>

      <div className="mt-1 space-y-1">
        {visibleRows.map((row) => {
          return (
            <div
              key={row.familyId}
              className="flex items-center justify-between gap-2 text-[10px]"
            >
              <div className="min-w-0 truncate text-zinc-700">
                {row.familyId}
              </div>

              <div className="shrink-0 text-zinc-600">
                total {row.totalActions} • missing {row.missingActions} • near{" "}
                {row.nearActions} • present {row.presentActions} • top{" "}
                {formatScorePercent(row.topConfidence)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}