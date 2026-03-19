"use client";

function clampNumber(value: number, min: number, max: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

function formatWholeNumber(value: number): string {
  return `${Math.round(clampNumber(value, 0, 9999))}`;
}

function formatOptionalWholePercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "n/a";
  return `${Math.round(clampNumber(value, 0, 100))}%`;
}

export type MomentInspectorRepairQueuePanelRow = {
  familyId: string;
  missingCount: number;
  nearCount: number;
  presentCount: number;
  driftUnstableCount: number;
  highestDriftSeverity: number;
  stabilityScore: number | null;
  stabilityPenalty: number;
  repairPriorityScore: number;
};

export default function MomentInspectorRepairQueuePanel(props: {
  rows: MomentInspectorRepairQueuePanelRow[];
}) {
  const { rows } = props;

  if (!rows || !rows.length) return null;

  const visibleRows = rows.slice(0, 8);

  return (
    <div className="mt-2 rounded border border-sky-200 bg-white px-2 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] font-medium uppercase tracking-wide text-sky-700">
          Repair Queue
        </div>

        <div className="text-[10px] text-sky-700">
          top {Math.min(8, rows.length)}
        </div>
      </div>

      <div className="mt-2 space-y-1">
        {visibleRows.map((row, index) => {
          return (
            <div
              key={`${row.familyId}:${row.repairPriorityScore}:${index}`}
              className="rounded border border-zinc-200 bg-zinc-50 px-2 py-1"
            >
              <div className="flex items-center justify-between gap-2 text-[10px]">
                <div className="min-w-0 truncate font-medium text-zinc-800">
                  {row.familyId}
                </div>

                <div className="text-sky-700">
                  score {formatWholeNumber(row.repairPriorityScore)}
                </div>
              </div>

              <div className="mt-1 text-[10px] text-zinc-600">
                missing {row.missingCount} • near {row.nearCount} • present{" "}
                {row.presentCount}
              </div>

              <div className="mt-1 text-[10px] text-zinc-500">
                drift unstable {row.driftUnstableCount} • highest severity{" "}
                {formatWholeNumber(row.highestDriftSeverity)}
              </div>

              <div className="mt-1 text-[10px] text-zinc-500">
                stability {formatOptionalWholePercent(row.stabilityScore)} • penalty{" "}
                {formatWholeNumber(row.stabilityPenalty)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}