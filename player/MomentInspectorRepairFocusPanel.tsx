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

function formatSeverityLabel(value: number): string {
  if (value >= 3) return "high";
  if (value >= 2) return "medium";
  if (value >= 1) return "low";
  return "none";
}

function getSeverityTone(value: number): string {
  if (value >= 3) return "text-red-700";
  if (value >= 2) return "text-amber-700";
  if (value >= 1) return "text-yellow-700";
  return "text-emerald-700";
}

function getFocusTone(params: {
  missingCount: number;
  nearCount: number;
  highestDriftSeverity: number;
}): string {
  const { missingCount, nearCount, highestDriftSeverity } = params;

  if (missingCount > 0 || highestDriftSeverity >= 3) {
    return "border-red-200 bg-red-50";
  }

  if (nearCount > 0 || highestDriftSeverity >= 2) {
    return "border-amber-200 bg-amber-50";
  }

  return "border-emerald-200 bg-emerald-50";
}

export type MomentInspectorRepairFocusRow = {
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

export default function MomentInspectorRepairFocusPanel(props: {
  row: MomentInspectorRepairFocusRow | null;
}) {
  const { row } = props;

  if (!row) return null;

  const severityLabel = formatSeverityLabel(row.highestDriftSeverity);
  const severityTone = getSeverityTone(row.highestDriftSeverity);
  const focusTone = getFocusTone({
    missingCount: row.missingCount,
    nearCount: row.nearCount,
    highestDriftSeverity: row.highestDriftSeverity,
  });

  return (
    <div className={`mt-2 rounded border px-2 py-2 ${focusTone}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-800">
          Recommended Repair Focus
        </div>

        <div className="text-[10px] text-zinc-800">
          score {formatWholeNumber(row.repairPriorityScore)}
        </div>
      </div>

      <div className="mt-1 text-[11px] font-medium text-zinc-900">
        {row.familyId}
      </div>

      <div className="mt-1 text-[10px] text-zinc-700">
        missing {row.missingCount} • near {row.nearCount} • present{" "}
        {row.presentCount}
      </div>

      <div className="mt-1 text-[10px] text-zinc-700">
        drift unstable {row.driftUnstableCount} • highest severity{" "}
        <span className={severityTone}>{severityLabel}</span>
      </div>

      <div className="mt-1 text-[10px] text-zinc-700">
        stability {formatOptionalWholePercent(row.stabilityScore)} • penalty{" "}
        {formatWholeNumber(row.stabilityPenalty)}
      </div>
    </div>
  );
}